import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handleError } from "@/lib/server/handleError";
import { refreshSession } from "@/lib/server/refreshSession";
import { setTokensInCookies } from "@/lib/server/token";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      console.error("[refresh] No refresh token cookie found");
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const tokens = await refreshSession(refreshToken);

    const res = NextResponse.json({ success: true });
    setTokensInCookies(res, tokens.accessToken, tokens.refreshToken);

    return res;
  } catch (error) {
    return handleError(error);
  }
}
