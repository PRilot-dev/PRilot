import { NextResponse } from "next/server";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

interface Deps {
	prisma: PrismaClient;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { prisma, getCurrentUser: defaultGetCurrentUser };

export function createGetHandler(deps: Deps = defaultDeps) {
	return async () => {
		try {
			// 1. Find user
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			// 2. Fetch repositories where user is a member
			const repositories = await deps.prisma.repository.findMany({
				where: {
					status: { not: "deleted" },
					members: {
						some: { userId: user.id },
					},
				},
				select: {
					id: true,
					provider: true,
					owner: true,
					name: true,
					defaultBranch: true,
					installationId: true,
					isPrivate: true,
					createdAt: true,
					members: { select: { userId: true, role: true } },
					_count: { select: { pullRequests: true } },
					pullRequests: { select: { status: true }, where: { createdById: user.id } },
				},
				orderBy: { createdAt: "desc" },
			});

			const result = repositories.map((repo) => {
				const userRole = repo.members.find((m) => m.userId === user.id)?.role ?? null;
				const draftPrCount = repo.pullRequests.filter((pr) => pr.status === "draft").length;
				const sentPrCount = repo.pullRequests.filter((pr) => pr.status === "sent").length;

				return {
					id: repo.id,
					name: repo.name,
					provider: repo.provider,
					owner: repo.owner,
					defaultBranch: repo.defaultBranch,
					installationId: repo.installationId,
					isPrivate: repo.isPrivate,
					createdAt: repo.createdAt,
					userRole,
					draftPrCount,
					sentPrCount,
				};
			});

			// 3. Fetch invitations for this user
			const invitations = await deps.prisma.invitation.findMany({
				where: { email: user.email, status: "pending" },
				select: {
					id: true,
					token: true,
					repository: { select: { id: true, name: true, provider: true } },
					createdAt: true,
					expiresAt: true,
					invitedBy: { select: { username: true } },
				},
				orderBy: { createdAt: "desc" },
			});

			// 4. Map invitations to include repository name directly
			const mappedInvitations = invitations.map((inv) => ({
				id: inv.id,
				token: inv.token,
				repositoryId: inv.repository.id,
				repositoryName: inv.repository.name,
				repositoryProvider: inv.repository.provider,
				invitedBy: inv.invitedBy.username,
				createdAt: inv.createdAt,
				expiresAt: inv.expiresAt,
			}));

			return NextResponse.json({
				repositories: result,
				invitations: mappedInvitations,
			});
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
