import { NextResponse } from "next/server";
import { getPrisma } from "@/db";
import { uuidParam } from "@/lib/schemas/id.schema";
import {
	BadRequestError,
	ForbiddenError,
	GitHubApiError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { gitApiProvider } from "@/lib/server/providers/git-api";
import { handleError } from "@/lib/server/handleError";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { githubRepoLimiter } from "@/lib/server/providers/rate-limiters";
import { getCurrentUser } from "@/lib/server/session";

const prisma = getPrisma();

export async function GET(
	_req: Request,
	context: { params: Promise<{ repoId: string }> },
) {
	try {
		// 1. Get current user
		const user = await getCurrentUser();
		if (!user) throw new UnauthorizedError("Unauthenticated");

		const { repoId } = await uuidParam("repoId").parseAsync(
			await context.params,
		);

		// 2. Rate limit per user
		const limit = await githubRepoLimiter.limit(`repo:user:${user.id}`);
		rateLimitOrThrow(limit);

		// 3. Fetch repo with members and installation
		const repo = await prisma.repository.findUnique({
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
				const branches = await gitApiProvider.listBranches(
					repo.installation.installationId,
					repo.owner,
					repo.name,
				);
				brancheNames = branches.map((b) => b.name);

				commitsCount = await gitApiProvider.getCommitCount(
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
			prisma.pullRequest.count({
				where: { ...prFilter, status: "draft" },
			}),
			prisma.pullRequest.count({
				where: { ...prFilter, status: "sent" },
			}),
		]);

		// 8. Members count
		const membersCount = await prisma.repositoryMember.count({
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
}

// ===================================
// DELETE a repository (owner only)
// ===================================
export async function DELETE(
	_req: Request,
	context: { params: Promise<{ repoId: string }> },
) {
	try {
		// 1. Get current user
		const user = await getCurrentUser();
		if (!user) throw new UnauthorizedError("Unauthenticated");

		const { repoId } = await uuidParam("repoId").parseAsync(
			await context.params,
		);

		// 2. Fetch repo with members
		const repo = await prisma.repository.findUnique({
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
		await prisma.$transaction([
			prisma.repository.update({
				where: { id: repoId },
				data: { status: "deleted" },
			}),
			prisma.repositoryMember.deleteMany({
				where: { repositoryId: repoId },
			}),
			prisma.invitation.deleteMany({
				where: { repositoryId: repoId, status: "pending" },
			}),
		]);

		return NextResponse.json({ success: true });
	} catch (error) {
		return handleError(error);
	}
}
