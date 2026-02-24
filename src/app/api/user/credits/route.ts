import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { aiLimiterPerWeek } from "@/lib/server/redis/rate-limiters";
import { getCurrentUser } from "@/lib/server/session";

const WEEKLY_LIMIT = 20;

export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			throw new UnauthorizedError("Unauthenticated");
		}

		const key = `ai:week:user:${user.id}`;
		const { remaining, reset } = await aiLimiterPerWeek.getRemaining(key);

		return NextResponse.json({
			remaining,
			total: WEEKLY_LIMIT,
			reset,
		});
	} catch (error) {
		return handleError(error);
	}
}
