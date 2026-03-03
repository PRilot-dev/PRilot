import { NextResponse } from "next/server";
import { getPrisma } from "@/db";
import { UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser } from "@/lib/server/session";

const prisma = getPrisma();

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Unauthenticated");

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    // Clear cookies on current device
    const response = NextResponse.json({ message: "All sessions terminated" });

    response.cookies.set("accessToken", "", {
      maxAge: 0,
      path: "/",
    });

    response.cookies.set("refreshToken", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
