import { vi } from "vitest";
import { testPrisma } from "../db";

// Database — real PrismaClient connected to the test PostgreSQL instance.
// Routes import `prisma` directly; we intercept that here so every
// route operates against the same test DB that our seeds/assertions use.
vi.mock("@/db", () => ({
	prisma: testPrisma,
	// Re-export enums so routes that import them still compile
	Provider: { github: "github", gitlab: "gitlab" },
	RepositoryRole: { owner: "owner", member: "member" },
	InvitationStatus: {
		pending: "pending",
		accepted: "accepted",
		declined: "declined",
	},
	RepositoryStatus: {
		active: "active",
		disconnected: "disconnected",
		deleted: "deleted",
	},
	PullRequestStatus: { draft: "draft", sent: "sent" },
	PullRequestMode: { fast: "fast", deep: "deep" },
}));
