import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPrisma } from "@/db";
import { handleError } from "@/lib/server/handleError";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { refreshLimiter } from "@/lib/server/redis/rate-limiters"; // new limiter
import { generateAccessToken, generateRefreshToken, setTokensInCookies } from "@/lib/server/token";

const prisma = getPrisma();

export async function POST() {
  try {
    // 1. Get refresh token from cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      console.error("[refresh] No refresh token cookie found");
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    // 2. Validate refresh token
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored) {
      console.error("[refresh] Token not found in database (possibly rotated)");
      return NextResponse.json({ error: "Refresh token expired" }, { status: 401 });
    }

    if (stored.expiresAt < new Date()) {
      console.error("[refresh] Token expired in database, userId:", stored.userId);
      return NextResponse.json({ error: "Refresh token expired" }, { status: 401 });
    }

    // 3. Rate limit per user
    const limit = await refreshLimiter.limit(`refresh:user:${stored.userId}`);
    rateLimitOrThrow(limit);

    // 4. Get user
    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    // 5. Rotate tokens (delete current refresh token, generate new pair)
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const newAccessToken = await generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);

    // 6. Return response with new tokens in cookies
    const res = NextResponse.json({ success: true });
    setTokensInCookies(res, newAccessToken, newRefreshToken);

    return res;
  } catch (error) {
    return handleError(error);
  }
}
