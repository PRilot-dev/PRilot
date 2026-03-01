import { NextResponse } from "next/server";
import { getCompareData } from "@/lib/server/github/compare";
import { redis } from "@/lib/server/redis/client";
import { buildCompareCacheKey } from "@/lib/server/redis/compareCacheKey";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import {
	aiLimiterPerMonth,
	githubCompareCommitsLimiter,
} from "@/lib/server/redis/rate-limiters";
import { formatDateTimeForErrors } from "@/lib/utils/formatDateTime";
import type { IGitHubFile } from "@/types/commits";

// ─── Cached compare data (cache → GitHub) ────────────────

interface CompareDataParams {
	repoId: string;
	baseBranch: string;
	compareBranch: string;
	userId: string;
	installationId: string;
	repoOwner: string;
	repoName: string;
}

export interface CompareResult {
	files: IGitHubFile[] | undefined;
	commits: string[];
	cacheHit: boolean;
}

export async function fetchCachedCompareData(
	params: CompareDataParams,
): Promise<CompareResult> {
	const cacheKey = buildCompareCacheKey(
		params.repoId,
		params.baseBranch,
		params.compareBranch,
	);

	try {
		const cached = await redis.get<string>(cacheKey);
		if (cached) {
			const data = JSON.parse(
				typeof cached === "string" ? cached : JSON.stringify(cached),
			);
			return {
				files: data.files,
				commits: data.commits ?? [],
				cacheHit: true,
			};
		}
	} catch {
		// Cache read failed — fall through to GitHub
	}

	const ghLimit = await githubCompareCommitsLimiter.limit(
		`github:compare:user:${params.userId}`,
	);
	rateLimitOrThrow(ghLimit);

	const compareData = await getCompareData(
		params.installationId,
		params.repoOwner,
		params.repoName,
		params.baseBranch,
		params.compareBranch,
	);

	return {
		files: compareData.files,
		commits: compareData.commits,
		cacheHit: false,
	};
}

// ─── Monthly rate limit check ─────────────────────────────

export async function checkMonthlyLimit(
	members: { userId: string; role: string }[],
	userId: string,
): Promise<NextResponse | { monthlyLimitKey: string; isOwner: boolean }> {
	const owner = members.find((m) => m.role === "owner");
	if (!owner) throw new Error("No owner found for repository");

	const isOwner = userId === owner.userId;
	const monthlyLimitKey = `ai:month:user:${owner.userId}`;
	const monthlyCheck = await aiLimiterPerMonth.getRemaining(monthlyLimitKey);

	if (monthlyCheck.remaining <= 0) {
		if (isOwner) {
			return NextResponse.json(
				{
					error: `Monthly PR generation limit reached. Resets on ${formatDateTimeForErrors(monthlyCheck.reset)}`,
					rateLimit: {
						monthlyRemaining: 0,
						monthlyReset: monthlyCheck.reset,
					},
				},
				{ status: 429 },
			);
		}

		return NextResponse.json(
			{
				error:
					"Repository owner monthly PR generation limit has been reached.",
			},
			{ status: 429 },
		);
	}

	return { monthlyLimitKey, isOwner };
}
