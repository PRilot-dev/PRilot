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
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { IGitProviderApi, IRateLimiter } from "@/lib/server/interfaces";
import { gitApiProvider } from "@/lib/server/providers/git-api";
import { githubCompareCommitsLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

interface Deps {
	prisma: PrismaClient;
	gitApiProvider: IGitProviderApi;
	githubCompareCommitsLimiter: IRateLimiter;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = {
	prisma,
	gitApiProvider,
	githubCompareCommitsLimiter,
	getCurrentUser: defaultGetCurrentUser,
};

export function createGetHandler(deps: Deps = defaultDeps) {
	return async (
		req: NextRequest,
		context: { params: Promise<{ repoId: string }> },
	) => {
		try {
			// 1. Find user
			const user = await deps.getCurrentUser();
			if (!user) throw new ForbiddenError("Unauthenticated");

			// 2. Get and validate repo id
			const { repoId } = await uuidParam("repoId").parseAsync(
				await context.params,
			);

			// 3. Rate limit per user
			const limit = await deps.githubCompareCommitsLimiter.limit(
				`github:compare:user:${user.id}`,
			);
			rateLimitOrThrow(limit);

			// 4. Get branch names from searchParams and validate
			const { searchParams } = new URL(req.url);
			const baseBranch = await branchSchema.parseAsync(searchParams.get("base"));
			const compareBranch = await branchSchema.parseAsync(
				searchParams.get("compare"),
			);

			// 5. Sanitize branch names
			const safeBaseBranch = sanitizeHtml(baseBranch);
			const safeCompareBranch = sanitizeHtml(compareBranch);

			if (!safeBaseBranch || !safeCompareBranch) {
				throw new BadRequestError("Missing base or compare branch");
			}

			// 6. Get repository + installation + members
			const repo = await deps.prisma.repository.findUnique({
				where: { id: repoId },
				include: { installation: true, members: true },
			});

			if (!repo || repo.status === "deleted")
				throw new NotFoundError("Repository not found");
			if (!repo.installation?.installationId) {
				throw new BadRequestError("Repository has no linked installation");
			}

			// 7. Check membership
			const isMember = repo.members.some((m) => m.userId === user.id);
			if (!isMember) {
				throw new ForbiddenError("You are not a member of this repository");
			}

			// 8. Fetch commits from GitHub
			const { commits } = await deps.gitApiProvider.compareBranches(
				repo.installation.installationId,
				repo.owner,
				repo.name,
				safeBaseBranch,
				safeCompareBranch,
			);

			return NextResponse.json({ commits });
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
