import { vi } from "vitest";

// GitHub fetch client — no real network calls in tests
vi.mock("@/lib/server/github/client", () => ({
	githubFetch: vi.fn(),
}));
