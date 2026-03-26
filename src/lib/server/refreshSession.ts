import "server-only";

import type { PrismaClient } from "@/db";
import { prisma as defaultPrisma } from "@/db";
import { UnauthorizedError } from "@/lib/server/error";
import type { IRateLimiter } from "@/lib/server/interfaces";
import { refreshLimiter as defaultRefreshLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { generateAccessToken, generateRefreshToken } from "@/lib/server/token";

interface RefreshSessionDeps {
  prisma: PrismaClient;
  refreshLimiter: IRateLimiter;
}

const defaultDeps: RefreshSessionDeps = {
  prisma: defaultPrisma,
  refreshLimiter: defaultRefreshLimiter,
};

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * Core refresh logic: validates the refresh token, rotates tokens, and returns a new pair.
 * Throws on failure (missing token, expired, rate-limited, user not found).
 */
export async function refreshSession(
  currentRefreshToken: string,
  deps: RefreshSessionDeps = defaultDeps,
): Promise<RefreshResult> {
  // 1. Validate refresh token in DB
  const stored = await deps.prisma.refreshToken.findUnique({
    where: { token: currentRefreshToken },
  });

  if (!stored) {
    throw new UnauthorizedError("Refresh token expired");
  }

  if (stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token expired");
  }

  // 2. Rate limit per user
  const limit = await deps.refreshLimiter.limit(`refresh:user:${stored.userId}`);
  rateLimitOrThrow(limit);

  // 3. Get user
  const user = await deps.prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    throw new Error("User not found");
  }

  // 4. Rotate tokens
  await deps.prisma.refreshToken.delete({ where: { id: stored.id } });
  const newAccessToken = await generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
