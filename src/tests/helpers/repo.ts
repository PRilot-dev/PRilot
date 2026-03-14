/**
 * Reusable seed helpers for repository-related tests.
 *
 * Most repo routes require an authenticated user who is a member of a
 * repository that belongs to a ProviderInstallation. These helpers set up
 * the full chain in a single call.
 */

import { testPrisma } from "@/tests/db";

type SeedRepoOptions = {
	userId: string;
	repoOverrides?: {
		name?: string;
		owner?: string;
		provider?: "github" | "gitlab";
		isPrivate?: boolean;
		defaultBranch?: string;
		status?: "active" | "disconnected" | "deleted";
	};
	role?: "owner" | "member";
};

/**
 * Creates a ProviderInstallation + Repository + RepositoryMember for the
 * given user. Returns all three records.
 */
export async function seedRepo({
	userId,
	repoOverrides = {},
	role = "owner",
}: SeedRepoOptions) {
	const installation = await testPrisma.providerInstallation.create({
		data: {
			provider: repoOverrides.provider ?? "github",
			installationId: `inst-${Date.now()}`,
			accountLogin: repoOverrides.owner ?? "test-org",
			accountType: "user",
			createdById: userId,
		},
	});

	const repository = await testPrisma.repository.create({
		data: {
			provider: repoOverrides.provider ?? "github",
			providerRepoId: `repo-${Date.now()}`,
			owner: repoOverrides.owner ?? "test-org",
			name: repoOverrides.name ?? "test-repo",
			isPrivate: repoOverrides.isPrivate ?? false,
			defaultBranch: repoOverrides.defaultBranch ?? "main",
			status: repoOverrides.status ?? "active",
			installationId: installation.id,
			members: {
				create: { userId, role },
			},
		},
		include: { members: true },
	});

	return { installation, repository };
}

type SeedPullRequestOptions = {
	repositoryId: string;
	createdById: string;
	overrides?: {
		title?: string;
		status?: "draft" | "sent";
		mode?: "fast" | "deep";
	};
};

/**
 * Creates a PullRequest for a given repository and user.
 */
export async function seedPullRequest({
	repositoryId,
	createdById,
	overrides = {},
}: SeedPullRequestOptions) {
	return testPrisma.pullRequest.create({
		data: {
			repositoryId,
			createdById,
			baseBranch: "main",
			compareBranch: `feature-${Date.now()}`,
			language: "en",
			title: overrides.title ?? "Test PR",
			description: "A test pull request",
			status: overrides.status ?? "draft",
			mode: overrides.mode ?? "fast",
		},
	});
}

/** Valid branch body for generate routes (fast/deep/prefetch). */
export function validBranchBody(overrides: Record<string, unknown> = {}) {
	return {
		baseBranch: "main",
		compareBranch: "feature/login",
		language: "English",
		...overrides,
	};
}

/** Valid body for draft PR creation. */
export function validDraftBody(overrides: Record<string, unknown> = {}) {
	return {
		prTitle: "Add login feature",
		prBody: "This PR adds the login feature with OAuth support.",
		baseBranch: "main",
		compareBranch: "feature/login",
		...overrides,
	};
}
