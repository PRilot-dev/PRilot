import { vi } from "vitest";

// GitHub fetch client — no real network calls in tests
vi.mock("@/lib/server/github/client", () => ({
	githubFetch: vi.fn(),
}));

// GitHub compare — used by compare-commits route and prefetch
vi.mock("@/lib/server/github/compare", () => ({
	getCompareData: vi.fn().mockResolvedValue({ commits: [], files: [] }),
}));

// GitHub App — installation verification
vi.mock("@/lib/server/github/app", () => ({
	verifyInstallation: vi.fn().mockResolvedValue({
		id: 12345,
		account: { login: "test-org", type: "User" },
	}),
}));

// GitHub file diffs — used by deep generation route
vi.mock("@/lib/server/github/fileDiffs", () => ({
	prepareFileDiffForAI: vi.fn().mockReturnValue({ patch: "mock diff content" }),
}));
