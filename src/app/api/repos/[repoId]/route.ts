import { NextResponse } from "next/server";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { uuidParam } from "@/lib/schemas/id.schema";
import {
	BadRequestError,
	ForbiddenError,
	GitHubApiError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { IGitProviderApi, IRateLimiter } from "@/lib/server/interfaces";
import { gitApiProvider } from "@/lib/server/providers/git-api";
import { githubRepoLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

interface Deps {
	prisma: PrismaClient;
	gitApiProvider: IGitProviderApi;
	githubRepoLimiter: IRateLimiter;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { prisma, gitApiProvider, githubRepoLimiter, getCurrentUser: defaultGetCurrentUser };

export function createGetHandler(deps: Deps = defaultDeps) {
	return async (
		_req: Request,
		context: { params: Promise<{ repoId: string }> },
	) => {
		try {
			// 1. Get current user
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			const { repoId } = await uuidParam("repoId").parseAsync(
				await context.params,
			);

			// 2. Rate limit per user
			const limit = await deps.githubRepoLimiter.limit(`repo:user:${user.id}`);
			rateLimitOrThrow(limit);

			// 3. Fetch repo with members and installation
			const repo = await deps.prisma.repository.findUnique({
				where: { id: repoId },
				include: { installation: true, members: true },
			});
			if (!repo || repo.status === "deleted")
				throw new NotFoundError("Repository not found");

			// 4. Check membership
			const membership = repo.members.find((m) => m.userId === user.id);
			if (!membership)
				throw new NotFoundError("Repository not found or unauthorized");
			const userRole = membership.role;

			// 5. GitHub branches + commits (skip if repo is disconnected)
			let brancheNames: string[] = [];
			let commitsCount = 0;
			let isAccessible = repo.status !== "disconnected";

			if (isAccessible) {
				try {
					const branches = await deps.gitApiProvider.listBranches(
						repo.installation.installationId,
						repo.owner,
						repo.name,
					);
					brancheNames = branches.map((b) => b.name);

					commitsCount = await deps.gitApiProvider.getCommitCount(
						repo.installation.installationId,
						repo.owner,
						repo.name,
						repo.defaultBranch,
					);
				} catch (err) {
					if (err instanceof GitHubApiError || err instanceof BadRequestError) {
						isAccessible = false;
					} else {
						throw err;
					}
				}
			}

			// 7. Global PR counts (scoped to current user)
			const prFilter = { repositoryId: repo.id, createdById: user.id };
			const [draftPrCount, sentPrCount] = await Promise.all([
				deps.prisma.pullRequest.count({
					where: { ...prFilter, status: "draft" },
				}),
				deps.prisma.pullRequest.count({
					where: { ...prFilter, status: "sent" },
				}),
			]);

			// 8. Members count
			const membersCount = await deps.prisma.repositoryMember.count({
				where: { repositoryId: repoId },
			});

			// 9. Return response
			return NextResponse.json({
				repository: {
					id: repo.id,
					name: repo.name,
					provider: repo.provider,
					owner: repo.owner,
					defaultBranch: repo.defaultBranch,
					installationId: repo.installation?.installationId ?? null,
					createdAt: repo.createdAt,
					userRole,
					isPrivate: repo.isPrivate,
					draftPrCount,
					sentPrCount,
					membersCount,
				},
				branches: brancheNames,
				commitsCount,
				isAccessible,
			});
		} catch (error) {
			return handleError(error);
		}
	};
}

// ===================================
// DELETE a repository (owner only)
// ===================================
export function createDeleteHandler(deps: Deps = defaultDeps) {
	return async (
		_req: Request,
		context: { params: Promise<{ repoId: string }> },
	) => {
		try {
			// 1. Get current user
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			const { repoId } = await uuidParam("repoId").parseAsync(
				await context.params,
			);

			// 2. Fetch repo with members
			const repo = await deps.prisma.repository.findUnique({
				where: { id: repoId },
				include: { members: true },
			});
			if (!repo || repo.status === "deleted")
				throw new NotFoundError("Repository not found");

			// 3. Check user is the owner
			const membership = repo.members.find((m) => m.userId === user.id);
			if (!membership)
				throw new NotFoundError("Repository not found or unauthorized");
			if (membership.role !== "owner")
				throw new ForbiddenError("Only the owner can delete a repository");

			// 4. Soft delete: set status to deleted, remove members and pending invitations
			await deps.prisma.$transaction([
				deps.prisma.repository.update({
					where: { id: repoId },
					data: { status: "deleted" },
				}),
				deps.prisma.repositoryMember.deleteMany({
					where: { repositoryId: repoId },
				}),
				deps.prisma.invitation.deleteMany({
					where: { repositoryId: repoId, status: "pending" },
				}),
			]);

			return NextResponse.json({ success: true });
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
export const DELETE = createDeleteHandler();
