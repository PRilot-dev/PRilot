import { type NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { getPrisma } from "@/db";
import { branchSchema } from "@/lib/schemas/branch.schema";
import { uuidParam } from "@/lib/schemas/id.schema";
import { languageSchema } from "@/lib/schemas/pr.schema";
import { cerebras } from "@/lib/server/ai/client";
import { buildPRFromDiffs, fixDescriptionHeaders } from "@/lib/server/ai/prompt";
import { createSSEResponse, streamCerebrasTokens } from "@/lib/server/ai/streamSSE";
import { summarizeDiffsForPR } from "@/lib/server/ai/summarizeFileDiffs";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { checkWeeklyLimit, fetchCachedCompareData } from "@/lib/server/pr-generation";
import { redis } from "@/lib/server/redis/client";
import { buildSummaryCacheKey } from "@/lib/server/redis/compareCacheKey";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { aiLimiterPerMinute, aiLimiterPerWeek } from "@/lib/server/redis/rate-limiters";
import { getCurrentUser } from "@/lib/server/session";
import type { IPRResponse } from "@/types/pullRequests";


export const dynamic = "force-dynamic";

const prisma = getPrisma();
const MIN_DESCRIPTION_LENGTH = 500;

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

		// 6. Fetch file diffs + commits (try prefetch cache first, fall back to GitHub)
		const t0 = performance.now();
		const { files, commits, cacheHit } = await fetchCachedCompareData({
			repoId,
			baseBranch: safeBase,
			compareBranch: safeCompare,
			userId: user.id,
			installationId: repo.installation.installationId,
			repoOwner: repo.owner,
			repoName: repo.name,
		});
		console.log(`[DEEP] File diffs: ${(performance.now() - t0).toFixed(0)}ms (${cacheHit ? "cache hit" : "GitHub fetch"}, ${files?.length ?? 0} files)`);

		if (!files || files.length === 0) {
			throw new BadRequestError("No file changes found between branches");
		}

		const changedFiles = files.filter((f) => f.status !== "deleted");
		if (changedFiles.length > 30) {
			throw new BadRequestError(
				"Too many files have changes, maximum is 30 for deep mode. Please use fast mode instead.",
			);
		}

		// 7. AI per-minute limit
		const minuteLimit = await aiLimiterPerMinute.limit(
			`ai:minute:user:${user.id}`,
		);
		rateLimitOrThrow(minuteLimit);

		// 8. Owner-based weekly limit (check only, increment on success)
		const weeklyResult = await checkWeeklyLimit(repo.members, user.id);
		if (weeklyResult instanceof NextResponse) return weeklyResult;
		const { weeklyLimitKey, isOwner } = weeklyResult;

		// 9. Summarize diffs (stage 1) — cached to avoid re-summarizing on repeated generations
		const t2 = performance.now();
		const summaryCacheKey = buildSummaryCacheKey(repoId, safeBase, safeCompare);
		let diffSummaries: string | null = null;
		let summaryCacheHit = false;

		try {
			const cachedSummary = await redis.get<string>(summaryCacheKey);
			if (cachedSummary) {
				diffSummaries = typeof cachedSummary === "string" ? cachedSummary : JSON.stringify(cachedSummary);
				summaryCacheHit = true;
			}
		} catch {
			// Cache read failed — fall through to AI summarization
		}

		if (!diffSummaries) {
			diffSummaries = await summarizeDiffsForPR(files);
			try {
				await redis.set(summaryCacheKey, diffSummaries, { ex: 180 });
			} catch {
				// Cache write failed — non-blocking, continue
			}
		}

		const t3 = performance.now();
		console.log(`[DEEP] Summarize diffs: ${(t3 - t2).toFixed(0)}ms (${summaryCacheHit ? "cache hit" : "Cerebras"})`);

		// 10. PR generation (stage 2) — streamed via SSE
		return createSSEResponse(async (send) => {
			async function streamGeneration() {
				const completion = await cerebras.chat.completions.create({
					model: "gpt-oss-120b",
					messages: [
						{
							role: "system",
							content: buildPRFromDiffs(language, safeCompare),
						},
						{
							role: "user",
							content: `File diffs summary:\n${diffSummaries}${commits.length > 0 ? `\n\nCommit messages:\n${commits.map((c) => `- ${c}`).join("\n")}` : ""}`,
						},
					],
					response_format: {
						type: "json_schema",
						json_schema: {
							name: "json",
							schema: { title: "", description: "" },
						},
					},
					stream: true,
					temperature: 0.4,
					reasoning_effort: "low",
				});

				return streamCerebrasTokens(completion, send);
			}

			// First attempt
			const t4 = performance.now();
			let result = await streamGeneration();
			console.log(
				`[DEEP] PR generation streamed (Cerebras): ${(performance.now() - t4).toFixed(0)}ms | tokens: ${result.usage?.promptTokens ?? "?"}in/${result.usage?.completionTokens ?? "?"}out/${result.usage?.totalTokens ?? "?"}total`,
			);

			let parsed = JSON.parse(result.text) as IPRResponse;

			// Retry if description is too short
			if (parsed.description.length < MIN_DESCRIPTION_LENGTH) {
				console.log(
					`[DEEP] Description too short (${parsed.description.length} chars), retrying...`,
				);
				send("retry", {});

				const t6 = performance.now();
				result = await streamGeneration();
				console.log(
					`[DEEP] PR generation retry streamed: ${(performance.now() - t6).toFixed(0)}ms | tokens: ${result.usage?.promptTokens ?? "?"}in/${result.usage?.completionTokens ?? "?"}out/${result.usage?.totalTokens ?? "?"}total`,
				);

				parsed = JSON.parse(result.text) as IPRResponse;

				if (parsed.description.length < MIN_DESCRIPTION_LENGTH) {
					send("error", {
						message:
							"AI generated a description that was too short. Please try again.",
					});
					return;
				}
			}

			// 11. Success — consume weekly rate limit credit
			const weeklyLimit =
				await aiLimiterPerWeek.limit(weeklyLimitKey);

			parsed.description = fixDescriptionHeaders(parsed.description);
			const response: IPRResponse = { ...parsed };
			if (isOwner) {
				response.rateLimit = {
					weeklyRemaining: weeklyLimit.remaining,
					weeklyReset: weeklyLimit.reset,
				};
			}

			console.log(
				`[DEEP] Total: ${(performance.now() - t0).toFixed(0)}ms`,
			);
			send("done", response);
		}, "[DEEP]");
	} catch (error) {
		return handleError(error);
	}
}
