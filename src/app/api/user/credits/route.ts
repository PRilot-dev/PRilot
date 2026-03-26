import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { IRateLimiter } from "@/lib/server/interfaces";
import { aiLimiterPerMonth } from "@/lib/server/providers/rate-limiters";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

const MONTHLY_LIMIT = 30;

interface Deps {
	aiLimiterPerMonth: IRateLimiter;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { aiLimiterPerMonth, getCurrentUser: defaultGetCurrentUser };

export function createGetHandler(deps: Deps = defaultDeps) {
	return async () => {
		try {
			const user = await deps.getCurrentUser();

			if (!user) {
				throw new UnauthorizedError("Unauthenticated");
			}

			const key = `ai:month:user:${user.id}`;
			const { remaining, reset } = await deps.aiLimiterPerMonth.getRemaining(key);

			return NextResponse.json({
				remaining,
				total: MONTHLY_LIMIT,
				reset,
			});
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
