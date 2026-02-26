import { NextResponse } from "next/server";
import { getPrisma, Provider, type ProviderInstallation } from "@/db";
import {
	BadRequestError,
	ConflictError,
	UnauthorizedError,
} from "@/lib/server/error";
import { verifyInstallation } from "@/lib/server/github/app";
import { githubFetch } from "@/lib/server/github/client";
import type {
	IGitHubRepo,
	IGitHubReposResponse,
} from "@/lib/server/github/types";
import { handleError } from "@/lib/server/handleError";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { githubInstallLimiter } from "@/lib/server/redis/rate-limiters";
import { getCurrentUser } from "@/lib/server/session";

const prisma = getPrisma();

export async function POST(req: Request) {
	try {
		// 1. Get current user
		const user = await getCurrentUser();

		if (!user) {
			throw new UnauthorizedError("You must be logged in to connect GitHub");
		}

		// 2. Rate limit per user
		const limit = await githubInstallLimiter.limit(
			`github:install:user:${user.id}`,
		);
		rateLimitOrThrow(limit);

		// 3. Parse request
		const { installationId } = await req.json();

		if (!installationId) {
			throw new BadRequestError("Installation ID is required");
		}

		// 4. Verify installation via GitHub
		const installation = await verifyInstallation(installationId);

		// 5. Find or create installation in DB (keyed on installationId, not user)
		const existing = await prisma.providerInstallation.findUnique({
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
			dbInstallation = await prisma.providerInstallation.update({
				where: { id: existing.id },
				data: {
					accountLogin: installation.account.login,
					accountType: installation.account.type.toLowerCase(),
				},
			});
		} else {
			dbInstallation = await prisma.providerInstallation.create({
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
		const reposList = await githubFetch<IGitHubReposResponse>(
			installationId,
			"/installation/repositories",
		);

		if (!reposList.data.repositories) {
			throw new BadRequestError("No repositories found for this installation");
		}

		const repos = reposList.data.repositories.map((r: IGitHubRepo) => ({
			provider: Provider.github,
			providerRepoId: r.id.toString(),
			name: r.name,
			isPrivate: r.private,
			defaultBranch: r.default_branch || "main",
			owner: r.owner.login,
		}));

		// 7. Upsert repos and repo members in DB
		for (const repo of repos) {
			const dbRepo = await prisma.repository.upsert({
				where: {
					provider_providerRepoId: {
						provider: repo.provider,
						providerRepoId: repo.providerRepoId,
					},
				},
				update: { ...repo, installationId: dbInstallation.id, status: "active" },
				create: { ...repo, installationId: dbInstallation.id },
			});

			await prisma.repositoryMember.upsert({
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
}
