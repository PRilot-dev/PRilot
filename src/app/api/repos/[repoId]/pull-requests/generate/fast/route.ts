import { type NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { branchSchema } from "@/lib/schemas/branch.schema";
import { uuidParam } from "@/lib/schemas/id.schema";
import { languageSchema } from "@/lib/schemas/pr.schema";
import { createSSEResponse } from "@/lib/server/ai/streamSSE";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { IAIProvider, IRateLimiter } from "@/lib/server/interfaces";
import {
	checkMonthlyLimit,
	FastStrategy,
	fetchCachedCompareData,
	PRGenerationPipeline,
} from "@/lib/server/pr-generation";
import { aiProvider } from "@/lib/server/providers/ai";
import { aiLimiterPerMinute, aiLimiterPerMonth } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";
import type { IPRResponse } from "@/types/pullRequests";

export const dynamic = "force-dynamic";

interface Deps {
	prisma: PrismaClient;
	aiProvider: IAIProvider;
	aiLimiterPerMinute: IRateLimiter;
	aiLimiterPerMonth: IRateLimiter;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = {
	prisma,
	aiProvider,
	aiLimiterPerMinute,
	aiLimiterPerMonth,
	getCurrentUser: defaultGetCurrentUser,
};

export function createPostHandler(deps: Deps = defaultDeps) {
	const pipeline = new PRGenerationPipeline(deps.aiProvider);

	return async (
		req: NextRequest,
		context: { params: Promise<{ repoId: string }> },
	) => {
		try {
			// 1. Auth
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("You must be logged in");

			// 2. Repo ID
			const { repoId } = await uuidParam("repoId").parseAsync(
				await context.params,
			);

			// 3. Parse body
			const body = await req.json();
			const baseBranch = await branchSchema.parseAsync(body.baseBranch);
			const compareBranch = await branchSchema.parseAsync(body.compareBranch);
			const language = await languageSchema.default("English").parseAsync(body.language);

			const safeBase = sanitizeHtml(baseBranch);
			const safeCompare = sanitizeHtml(compareBranch);

			if (!safeBase || !safeCompare) {
				throw new BadRequestError("Invalid branch names");
			}

			// 4. Fetch repo + members + installation
			const repo = await deps.prisma.repository.findUnique({
				where: { id: repoId },
				include: {
					installation: true,
					members: true,
				},
			});

			if (!repo || repo.status === "deleted")
				throw new NotFoundError("Repository not found");
			if (!repo.installation?.installationId) {
				throw new BadRequestError("Repository has no linked installation");
			}

			// 5. Membership check
			const isMember = repo.members.some((m) => m.userId === user.id);
			if (!isMember) {
				throw new ForbiddenError("You are not a member of this repository");
			}

			// 6. Fetch compare data (try prefetch cache first, fall back to GitHub)
			const compareData = await fetchCachedCompareData({
				repoId,
				baseBranch: safeBase,
				compareBranch: safeCompare,
				userId: user.id,
				installationId: repo.installation.installationId,
				repoOwner: repo.owner,
				repoName: repo.name,
			});

			// 7. AI per-minute limit
			const minuteLimit = await deps.aiLimiterPerMinute.limit(
				`ai:minute:user:${user.id}`,
			);
			rateLimitOrThrow(minuteLimit);

			// 8. Owner-based monthly limit (check only, increment on success)
			const monthlyResult = await checkMonthlyLimit(repo.members, user.id);
			if (monthlyResult instanceof NextResponse) return monthlyResult;
			const { monthlyLimitKey, isOwner } = monthlyResult;

			// 9. PR generation — streamed via SSE
			return createSSEResponse(async (send) => {
				const result = await pipeline.generate(new FastStrategy(), {
					compareData,
					language,
					compareBranch: safeCompare,
					send,
				});

				if (!result) return;

				// Success — consume monthly rate limit credit
				const monthlyLimit = await deps.aiLimiterPerMonth.limit(monthlyLimitKey);

				const response: IPRResponse = { ...result };
				if (isOwner) {
					response.rateLimit = {
						monthlyRemaining: monthlyLimit.remaining,
						monthlyReset: monthlyLimit.reset,
					};
				}

				send("done", response);
			}, "[FAST]");
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
