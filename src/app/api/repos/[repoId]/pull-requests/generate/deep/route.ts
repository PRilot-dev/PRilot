import { type NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { getPrisma } from "@/db";
import { branchSchema } from "@/lib/schemas/branch.schema";
import { uuidParam } from "@/lib/schemas/id.schema";
import { cerebras } from "@/lib/server/ai/client";
import { buildPRFromDiffs } from "@/lib/server/ai/prompt";
import { createSSEResponse, streamCerebrasTokens } from "@/lib/server/ai/streamSSE";
import { summarizeDiffsForPR } from "@/lib/server/ai/summarizeFileDiffs";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { getFileDiffs } from "@/lib/server/github/fileDiffs";
import { handleError } from "@/lib/server/handleError";
import { redis } from "@/lib/server/redis/client";
import { buildCompareCacheKey } from "@/lib/server/redis/compareCacheKey";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import {
	aiLimiterPerMinute,
	aiLimiterPerWeek,
	githubCompareCommitsLimiter,
} from "@/lib/server/redis/rate-limiters";
import { getCurrentUser } from "@/lib/server/session";
import { formatDateTimeForErrors } from "@/lib/utils/formatDateTime";
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
		const language = body.language;

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

		// 6. Fetch file diffs (try prefetch cache first, fall back to GitHub)
		const t0 = performance.now();
		const cacheKey = buildCompareCacheKey(repoId, safeBase, safeCompare);

		let files: Awaited<ReturnType<typeof getFileDiffs>>;
		let cacheHit = false;

		try {
			const cached = await redis.get<string>(cacheKey);
			if (cached) {
				const data = JSON.parse(typeof cached === "string" ? cached : JSON.stringify(cached));
				files = data.files;
				cacheHit = true;
			}
		} catch {
			// Cache read failed — fall through to GitHub
		}

		if (!files) {
			const ghLimit = await githubCompareCommitsLimiter.limit(
				`github:compare:user:${user.id}`,
			);
			rateLimitOrThrow(ghLimit);

			files = await getFileDiffs(
				repo.installation.installationId,
				repo.owner,
				repo.name,
				safeBase,
				safeCompare,
			);
		}

		const t1 = performance.now();
		console.log(`[DEEP] File diffs: ${(t1 - t0).toFixed(0)}ms (${cacheHit ? "cache hit" : "GitHub fetch"}, ${files?.length ?? 0} files)`);

		if (!files || files.length === 0) {
			throw new BadRequestError("No file changes found between branches");
		}

		const changedFiles = files.filter((f) => f.status !== "deleted");
		if (changedFiles.length > 30) {
			throw new BadRequestError(
				"Too many files have changes, maximum is 30 for deep mode. Please us fast mode instead.",
			);
		}

		// 7. AI per-minute limit
		const minuteLimit = await aiLimiterPerMinute.limit(
			`ai:minute:user:${user.id}`,
		);
		rateLimitOrThrow(minuteLimit);

		// 8. Owner-based weekly limit (check only, increment on success)
		const owner = repo.members.find((m) => m.role === "owner");
		if (!owner) throw new Error("No owner found for repository");

		const weeklyLimitKey = `ai:week:user:${owner.userId}`;
		const weeklyCheck = await aiLimiterPerWeek.getRemaining(weeklyLimitKey);

		if (weeklyCheck.remaining <= 0) {
			if (user.id === owner.userId) {
				return NextResponse.json(
					{
						error: `Weekly PR generation limit reached. Resets on ${formatDateTimeForErrors(weeklyCheck.reset)}`,
						rateLimit: {
							weeklyRemaining: 0,
							weeklyReset: weeklyCheck.reset,
						},
					},
					{ status: 429 },
				);
			}

			return NextResponse.json(
				{
					error:
						"Repository owner weekly PR generation limit has been reached.",
				},
				{ status: 429 },
			);
		}

		// 9. Summarize diffs (stage 1)
		const t2 = performance.now();
		const diffSummaries = await summarizeDiffsForPR(files);
		const t3 = performance.now();
		console.log(`[DEEP] Summarize diffs (Cerebras): ${(t3 - t2).toFixed(0)}ms`);

		// 10. PR generation (stage 2) — streamed via SSE
		return createSSEResponse(async (send) => {
			async function streamGeneration(): Promise<string> {
				const completion = await cerebras.chat.completions.create({
					model: "gpt-oss-120b",
					messages: [
						{
							role: "system",
							content: buildPRFromDiffs(language, safeCompare),
						},
						{
							role: "user",
							content: `File diffs summary: ${diffSummaries}`,
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
				});

				return streamCerebrasTokens(completion, send);
			}

			// First attempt
			const t4 = performance.now();
			let rawJson = await streamGeneration();
			console.log(
				`[DEEP] PR generation streamed (Cerebras): ${(performance.now() - t4).toFixed(0)}ms`,
			);

			let parsed = JSON.parse(rawJson) as IPRResponse;

			// Retry if description is too short
			if (parsed.description.length < MIN_DESCRIPTION_LENGTH) {
				console.log(
					`[DEEP] Description too short (${parsed.description.length} chars), retrying...`,
				);
				send("retry", {});

				const t6 = performance.now();
				rawJson = await streamGeneration();
				console.log(
					`[DEEP] PR generation retry streamed: ${(performance.now() - t6).toFixed(0)}ms`,
				);

				parsed = JSON.parse(rawJson) as IPRResponse;

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

			const response: IPRResponse = { ...parsed };
			if (user.id === owner.userId) {
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
