import { type NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { getPrisma } from "@/db";
import { branchSchema } from "@/lib/schemas/branch.schema";
import { uuidParam } from "@/lib/schemas/id.schema";
import { languageSchema } from "@/lib/schemas/pr.schema";
import { groq } from "@/lib/server/ai/client";
import { buildPRFromCommits, fixDescriptionHeaders } from "@/lib/server/ai/prompt";
import { createSSEResponse, streamGroqTokens } from "@/lib/server/ai/streamSSE";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { checkMonthlyLimit, fetchCachedCompareData } from "@/lib/server/pr-generation";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { aiLimiterPerMinute, aiLimiterPerMonth } from "@/lib/server/redis/rate-limiters";
import { getCurrentUser } from "@/lib/server/session";
import type { IPRResponse } from "@/types/pullRequests";

export const dynamic = "force-dynamic";

const prisma = getPrisma();

export async function POST(
	req: NextRequest,
	context: { params: Promise<{ repoId: string }> },
) {
	try {
		// 1. Auth
		const user = await getCurrentUser();
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
		const repo = await prisma.repository.findUnique({
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

		// 6. Fetch commit messages (try prefetch cache first, fall back to GitHub)
		const { commits, cacheHit } = await fetchCachedCompareData({
			repoId,
			baseBranch: safeBase,
			compareBranch: safeCompare,
			userId: user.id,
			installationId: repo.installation.installationId,
			repoOwner: repo.owner,
			repoName: repo.name,
		});
		console.log(`[FAST] Commits: ${cacheHit ? "cache hit" : "GitHub fetch"} (${commits.length} commits)`);

		if (!commits.length) {
			throw new BadRequestError("No commits found between branches");
		}

		// 8. AI per-minute limit
		const minuteLimit = await aiLimiterPerMinute.limit(
			`ai:minute:user:${user.id}`,
		);
		rateLimitOrThrow(minuteLimit);

		// 9. Owner-based monthly limit (check only, increment on success)
		const monthlyResult = await checkMonthlyLimit(repo.members, user.id);
		if (monthlyResult instanceof NextResponse) return monthlyResult;
		const { monthlyLimitKey, isOwner } = monthlyResult;

		// 10. PR generation — streamed via SSE
		return createSSEResponse(async (send) => {
			const t0 = performance.now();
			const completion = await groq.chat.completions.create({
				model: "openai/gpt-oss-120b",
				messages: [
					{
						role: "system",
						content: buildPRFromCommits(language, safeCompare),
					},
					{
						role: "user",
						content: commits
							.map((c, i) => `${i + 1}. ${c}`)
							.join("\n"),
					},
				],
				response_format: { type: "json_object" },
				stream: true,
				temperature: 0.4
			});

			const { text, usage } = await streamGroqTokens(completion, send);
			console.log(
				`[FAST] PR generation streamed (Groq): ${(performance.now() - t0).toFixed(0)}ms | tokens: ${usage?.promptTokens ?? "?"}in/${usage?.completionTokens ?? "?"}out/${usage?.totalTokens ?? "?"}total`,
			);

			const parsed = JSON.parse(text) as IPRResponse;

			// Success — consume monthly rate limit credit
			const monthlyLimit = await aiLimiterPerMonth.limit(monthlyLimitKey);

			parsed.description = fixDescriptionHeaders(parsed.description);
			const response: IPRResponse = { ...parsed };
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
}
