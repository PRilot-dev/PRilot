import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { config } from "@/lib/server/config";
import { handleError } from "@/lib/server/handleError";
import type { IRateLimiter } from "@/lib/server/interfaces";
import { getClientIp } from "@/lib/server/ip";
import { githubOAuthStartLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";

interface Deps {
	githubOAuthStartLimiter: IRateLimiter;
}

const defaultDeps: Deps = { githubOAuthStartLimiter };

const OAUTH_STATE_MAX_AGE = 60 * 10; // 10 minutes

export function createGetHandler(deps: Deps = defaultDeps) {
	return async (req: Request) => {
		try {
			// 1. Get client IP
			const ip = getClientIp(req);

			// 2. Rate limit per IP
			const limit = await deps.githubOAuthStartLimiter.limit(
				`github:start:ip:${ip}`,
			);
			rateLimitOrThrow(limit);

			// 3. Generate CSRF state parameter
			const state = crypto.randomBytes(32).toString("hex");

			// 4. Construct GitHub OAuth URL
			const url = new URL(
				"https://github.com/login/oauth/authorize",
			);
			url.searchParams.set("client_id", config.github.clientId);
			url.searchParams.set(
				"redirect_uri",
				`${config.frontendUrl}/login/github/callback`,
			);
			url.searchParams.set("scope", "read:user user:email");
			url.searchParams.set("allow_signup", "false");
			url.searchParams.set("state", state);

			// 5. Redirect to GitHub OAuth page with state cookie
			const isProd = process.env.NODE_ENV === "production";
			const res = NextResponse.redirect(url.toString());
			res.cookies.set("github_oauth_state", state, {
				httpOnly: true,
				maxAge: OAUTH_STATE_MAX_AGE,
				sameSite: "lax",
				secure: isProd,
				path: "/",
			});

			return res;
		} catch (err) {
			return handleError(err);
		}
	};
}

export const GET = createGetHandler();
