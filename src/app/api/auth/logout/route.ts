import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPrisma } from "@/db";
import { handleError } from "@/lib/server/handleError";

const prisma = getPrisma();

export async function POST() {
  try {
    // Delete only the current session's refresh token
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (refreshToken) {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      }).catch(() => {});
    }

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
