import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handleError } from "@/lib/server/handleError";
import { refreshSession as defaultRefreshSession } from "@/lib/server/refreshSession";
import { setTokensInCookies } from "@/lib/server/token";

interface Deps {
	refreshSession: typeof defaultRefreshSession;
}

const defaultDeps: Deps = { refreshSession: defaultRefreshSession };

export function createPostHandler(deps: Deps = defaultDeps) {
	return async () => {
		try {
			const cookieStore = await cookies();
			const refreshToken = cookieStore.get("refreshToken")?.value;

			if (!refreshToken) {
				console.error("[refresh] No refresh token cookie found");
				return NextResponse.json(
					{ error: "No refresh token" },
					{ status: 401 },
				);
			}

			const tokens = await deps.refreshSession(refreshToken);

			const res = NextResponse.json({ success: true });
			setTokensInCookies(res, tokens.accessToken, tokens.refreshToken);

			return res;
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
