import { vi } from "vitest";

// GitHub file diffs — used by deep generation route (pure transform, not a provider)
vi.mock("@/lib/server/github/fileDiffs", () => ({
	prepareFileDiffForAI: vi.fn().mockReturnValue({ patch: "mock diff content" }),
}));

// Git provider modules — all routes import from these
vi.mock("@/lib/server/providers/git-app", () => ({
	gitAppProvider: {
		verifyInstallation: vi.fn().mockResolvedValue({
			id: 12345,
			account: { login: "test-org", id: 1, type: "User" },
			repositorySelection: "all",
			permissions: {},
		}),
		createInstallationAccessToken: vi.fn().mockResolvedValue({
			token: "mock-installation-token",
			expiresAt: new Date(Date.now() + 3600_000).toISOString(),
		}),
	},
}));

vi.mock("@/lib/server/providers/git-api", () => ({
	gitApiProvider: {
		listRepositories: vi.fn().mockResolvedValue({
			totalCount: 0,
			repositories: [],
		}),
		listBranches: vi.fn().mockResolvedValue([]),
		getCommitCount: vi.fn().mockResolvedValue(0),
		compareBranches: vi.fn().mockResolvedValue({ commits: [], files: [] }),
		createPullRequest: vi.fn().mockResolvedValue({
			url: "https://github.com/test/repo/pull/1",
			number: 1,
			state: "open",
		}),
	},
}));

vi.mock("@/lib/server/providers/oauth", () => ({
	oauthProvider: {
		exchangeCodeForToken: vi.fn().mockResolvedValue({ accessToken: "mock-gh-token" }),
		getUserProfile: vi.fn().mockResolvedValue({
			providerUserId: "12345",
			login: "testuser",
			email: "test@example.com",
		}),
	},
}));
