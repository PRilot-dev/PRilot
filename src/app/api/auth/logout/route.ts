import { NextResponse } from "next/server";
import { getPrisma } from "@/db";
import { UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { decodeJWT, extractAccessToken } from "@/lib/server/token";

const prisma = getPrisma();

export async function POST() {
  try {
    // Extract & decode access token
    const accessToken = await extractAccessToken();
    const payload = await decodeJWT(accessToken);

    const userId = payload.userId as string;
    if (!userId) {
      throw new UnauthorizedError("Unauthenticated user");
    }

    // Delete refresh tokens from DB
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Clear cookies
    const response = new NextResponse(null, { status: 204 });

    response.cookies.set("accessToken", "", {
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("refreshToken", "", {
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("github_oauth_state", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
