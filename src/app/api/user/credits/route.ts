import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { aiLimiterPerMonth } from "@/lib/server/redis/rate-limiters";
import { getCurrentUser } from "@/lib/server/session";

const MONTHLY_LIMIT = 30;

export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			throw new UnauthorizedError("Unauthenticated");
		}

		const key = `ai:month:user:${user.id}`;
		const { remaining, reset } = await aiLimiterPerMonth.getRemaining(key);

		return NextResponse.json({
			remaining,
			total: MONTHLY_LIMIT,
			reset,
		});
	} catch (error) {
		return handleError(error);
	}
}
