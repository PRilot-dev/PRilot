import { type NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { branchSchema } from "@/lib/schemas/branch.schema";
import { uuidParam } from "@/lib/schemas/id.schema";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { ICacheProvider, IGitProviderApi, IRateLimiter } from "@/lib/server/interfaces";
import { cacheProvider } from "@/lib/server/providers/cache";
import { gitApiProvider } from "@/lib/server/providers/git-api";
import { githubCompareCommitsLimiter } from "@/lib/server/providers/rate-limiters";
import { buildCompareCacheKey } from "@/lib/server/redis/compareCacheKey";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

const MAX_CACHE_SIZE_BYTES = 512 * 1024; // 512 KB
const CACHE_TTL_SECONDS = 180; // 3 minutes

interface Deps {
	prisma: PrismaClient;
	cacheProvider: ICacheProvider;
	gitApiProvider: IGitProviderApi;
	githubCompareCommitsLimiter: IRateLimiter;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = {
	prisma,
	cacheProvider,
	gitApiProvider,
	githubCompareCommitsLimiter,
	getCurrentUser: defaultGetCurrentUser,
};

export function createPostHandler(deps: Deps = defaultDeps) {
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

			const safeBase = sanitizeHtml(baseBranch);
			const safeCompare = sanitizeHtml(compareBranch);

			if (!safeBase || !safeCompare) {
				throw new BadRequestError("Invalid branch names");
			}

			// 4. Fetch repo + members + installation
			const repo = await deps.prisma.repository.findUnique({
				where: { id: repoId },
				include: { installation: true, members: true },
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

			// 6. Rate limit
			const ghLimit = await deps.githubCompareCommitsLimiter.limit(
				`github:compare:user:${user.id}`,
			);
			rateLimitOrThrow(ghLimit);

			// 7. Fetch compare data from GitHub (files + commits in one call)
			const { files, commits } = await deps.gitApiProvider.compareBranches(
				repo.installation.installationId,
				repo.owner,
				repo.name,
				safeBase,
				safeCompare,
			);

			// 8. Cache if within size limit
			if ((files && files.length > 0) || commits.length > 0) {
				const serialized = JSON.stringify({ files, commits });
				if (serialized.length <= MAX_CACHE_SIZE_BYTES) {
					const cacheKey = buildCompareCacheKey(repoId, safeBase, safeCompare);
					await deps.cacheProvider.set(cacheKey, serialized, { ttlSeconds: CACHE_TTL_SECONDS });
				}
			}

			return NextResponse.json({ ok: true });
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
