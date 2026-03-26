import { NextResponse } from "next/server";
import type { PrismaClient, ProviderInstallation } from "@/db";
import { Provider, prisma } from "@/db";
import {
	BadRequestError,
	ConflictError,
	UnauthorizedError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { IGitProviderApi, IGitProviderApp, IRateLimiter } from "@/lib/server/interfaces";
import { gitApiProvider } from "@/lib/server/providers/git-api";
import { gitAppProvider } from "@/lib/server/providers/git-app";
import { githubInstallLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

interface Deps {
	prisma: PrismaClient;
	gitApiProvider: IGitProviderApi;
	gitAppProvider: IGitProviderApp;
	githubInstallLimiter: IRateLimiter;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = {
	prisma,
	gitApiProvider,
	gitAppProvider,
	githubInstallLimiter,
	getCurrentUser: defaultGetCurrentUser,
};

export function createPostHandler(deps: Deps = defaultDeps) {
	return async (req: Request) => {
		try {
			// 1. Get current user
			const user = await deps.getCurrentUser();

			if (!user) {
				throw new UnauthorizedError("You must be logged in to connect GitHub");
			}

			// 2. Rate limit per user
			const limit = await deps.githubInstallLimiter.limit(
				`github:install:user:${user.id}`,
			);
			rateLimitOrThrow(limit);

			// 3. Parse request
			const { installationId } = await req.json();

			if (!installationId) {
				throw new BadRequestError("Installation ID is required");
			}

			// 4. Verify installation via GitHub
			const installation = await deps.gitAppProvider.verifyInstallation(installationId);

			// 5. Find or create installation in DB (keyed on installationId, not user)
			const existing = await deps.prisma.providerInstallation.findUnique({
				where: {
					provider_installationId: {
						provider: "github",
						installationId,
					},
				},
			});

			let dbInstallation: ProviderInstallation;

			if (existing) {
				if (existing.createdById !== user.id) {
					throw new ConflictError(
						"This GitHub installation is already linked to another account",
					);
				}

				// Same user re-installing or modifying repos — update
				dbInstallation = await deps.prisma.providerInstallation.update({
					where: { id: existing.id },
					data: {
						accountLogin: installation.account.login,
						accountType: installation.account.type.toLowerCase(),
					},
				});
			} else {
				dbInstallation = await deps.prisma.providerInstallation.create({
					data: {
						provider: "github",
						installationId,
						accountLogin: installation.account.login,
						accountType: installation.account.type.toLowerCase(),
						createdById: user.id,
					},
				});
			}

			// 6. Fetch repos from GitHub
			const reposList = await deps.gitApiProvider.listRepositories(installationId);

			if (!reposList.repositories) {
				throw new BadRequestError("No repositories found for this installation");
			}

			const repos = reposList.repositories.map((r) => ({
				provider: Provider.github,
				providerRepoId: r.id.toString(),
				name: r.name,
				isPrivate: r.isPrivate,
				defaultBranch: r.defaultBranch || "main",
				owner: r.owner.login,
			}));

			// 7. Upsert repos and repo members in DB
			for (const repo of repos) {
				const dbRepo = await deps.prisma.repository.upsert({
					where: {
						provider_providerRepoId: {
							provider: repo.provider,
							providerRepoId: repo.providerRepoId,
						},
					},
					update: { ...repo, installationId: dbInstallation.id, status: "active" },
					create: { ...repo, installationId: dbInstallation.id },
				});

				await deps.prisma.repositoryMember.upsert({
					where: {
						repositoryId_userId: {
							repositoryId: dbRepo.id,
							userId: user.id,
						},
					},
					update: { role: "owner" },
					create: { repositoryId: dbRepo.id, userId: user.id, role: "owner" },
				});
			}

			// 8. Respond with installation + repo info
			return NextResponse.json({
				success: true,
				installationId: dbInstallation.id,
				repos,
			});
		} catch (err) {
			return handleError(err);
		}
	};
}

export const POST = createPostHandler();
