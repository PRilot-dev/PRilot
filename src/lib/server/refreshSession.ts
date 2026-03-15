import "server-only";

import { getPrisma } from "@/db";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { refreshLimiter } from "@/lib/server/redis/rate-limiters";
import { generateAccessToken, generateRefreshToken } from "@/lib/server/token";

const prisma = getPrisma();

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
): Promise<RefreshResult> {
  // 1. Validate refresh token in DB
  const stored = await prisma.refreshToken.findUnique({
    where: { token: currentRefreshToken },
  });

  if (!stored) {
    throw new Error("Refresh token not found");
  }

  if (stored.expiresAt < new Date()) {
    throw new Error("Refresh token expired");
  }

  // 2. Rate limit per user
  const limit = await refreshLimiter.limit(`refresh:user:${stored.userId}`);
  rateLimitOrThrow(limit);

  // 3. Get user
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    throw new Error("User not found");
  }

  // 4. Rotate tokens
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const newAccessToken = await generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
