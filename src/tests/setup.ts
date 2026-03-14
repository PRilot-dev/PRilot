/**
 * Vitest per-file setup — runs before every test file in the worker process.
 *
 * Database:
 *   A real PrismaClient connected to the test PostgreSQL is injected in place
 *   of the production @/db module.  Every test starts with a clean database
 *   (all tables truncated in beforeEach).
 *
 * External services mocked globally:
 *   - @/lib/server/session  → getCurrentUser() defaults to null (unauthenticated)
 *   - @/lib/server/token    → JWT helpers are no-ops (no signing, no DB writes)
 *   - @/lib/server/password → argon2 ops are instant stubs
 *   - rate-limiters         → every limiter always succeeds
 *   - github/client         → githubFetch is a vi.fn()
 *   - resend                → email helpers are vi.fn()
 *   - next/headers          → cookies() returns a controllable stub
 *
 * Per-test overrides:
 *   import { getCurrentUser } from "@/lib/server/session"
 *   vi.mocked(getCurrentUser).mockResolvedValue(mockUser())
 *
 *   // Seed data directly through testPrisma:
 *   import { testPrisma } from "@/tests/db"
 *   await testPrisma.user.create({ data: { ... } })
 */

import { afterAll, beforeEach, vi } from "vitest";
import { clearDatabase, testPrisma } from "./db.ts";

// ---------------------------------------------------------------------------
// next/headers — cookies() is used by token.ts / extractAccessToken
// ---------------------------------------------------------------------------
vi.mock("next/headers", () => ({
	cookies: vi.fn().mockResolvedValue({
		get: vi.fn().mockReturnValue(undefined),
		set: vi.fn(),
		delete: vi.fn(),
		has: vi.fn().mockReturnValue(false),
		getAll: vi.fn().mockReturnValue([]),
	}),
}));

// ---------------------------------------------------------------------------
// Config — avoids the Zod parse of real process.env for external services.
// db.url is intentionally kept pointing to the test database.
// ---------------------------------------------------------------------------
vi.mock("@/lib/server/config", () => ({
	config: {
		db: { url: "postgresql://postgres:postgres@localhost:5433/prilot_test" },
		jwt: { secret: "test-jwt-secret-that-is-at-least-32-chars!!" },
		github: {
			clientId: "test-github-client-id",
			clientSecret: "test-github-client-secret",
			oauthRedirectUri: "http://localhost:3000/api/auth/github/callback",
			appId: "12345",
			appPrivateKey:
				"-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAtest\n-----END RSA PRIVATE KEY-----",
			redirectUri: "http://localhost:3000/login/github/callback",
		},
		cerebras: { apiKey: "test-cerebras-api-key" },
		resend: { apiKey: "test-resend-api-key" },
		redis: {
			restUrl: "https://test.upstash.io",
			restToken: "test-upstash-token",
		},
		domainName: "localhost",
		appName: "PRilot Test",
		logoUrl: "http://localhost:3000/logo.png",
		frontendUrl: "http://localhost:3000",
		nodeEnv: "test",
	},
}));

// ---------------------------------------------------------------------------
// Database — real PrismaClient connected to the test PostgreSQL instance.
// Routes call getPrisma() at module level; we intercept that here so every
// route operates against the same test DB that our seeds/assertions use.
// ---------------------------------------------------------------------------
vi.mock("@/db", () => ({
	getPrisma: () => testPrisma,
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

// ---------------------------------------------------------------------------
// Session — unauthenticated by default; override per-test with mockResolvedValue
// ---------------------------------------------------------------------------
vi.mock("@/lib/server/session", () => ({
	getCurrentUser: vi.fn().mockResolvedValue(null),
}));

// ---------------------------------------------------------------------------
// Token helpers — avoid real JWT signing and DB refresh-token writes
// ---------------------------------------------------------------------------
vi.mock("@/lib/server/token", () => ({
	createSession: vi.fn().mockResolvedValue(undefined),
	generateAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
	generateRefreshToken: vi.fn().mockResolvedValue("mock-refresh-token"),
	setTokensInCookies: vi.fn(),
	decodeJWT: vi.fn().mockResolvedValue({ userId: "mock-user-id" }),
	extractAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
	ACCESS_TOKEN_DURATION_IN_MS: 3_600_000,
	REFRESH_TOKEN_DURATION_IN_MS: 604_800_000,
}));

// ---------------------------------------------------------------------------
// Password — argon2 is intentionally slow; use instant stubs for test speed
// ---------------------------------------------------------------------------
vi.mock("@/lib/server/password", () => ({
	hashPassword: vi
		.fn()
		.mockResolvedValue("$argon2id$v=19$m=65536,t=3,p=4$mockhash"),
	verifyPassword: vi.fn().mockResolvedValue(true),
}));

// ---------------------------------------------------------------------------
// Rate limiters — every limiter always succeeds (no Redis calls in tests)
// To test a rate-limited response, override per-test:
//   vi.mocked(signupLimiter.limit).mockResolvedValueOnce({ success: false, ... })
// ---------------------------------------------------------------------------
function passingLimiter() {
	return {
		limit: vi
			.fn()
			.mockResolvedValue({ success: true, reset: Date.now() + 60_000, remaining: 9 }),
	};
}

vi.mock("@/lib/server/redis/rate-limiters", () => ({
	loginLimiter: passingLimiter(),
	signupLimiter: passingLimiter(),
	githubOAuthStartLimiter: passingLimiter(),
	changePasswordLimiter: passingLimiter(),
	forgotPasswordLimiter: passingLimiter(),
	resetPasswordLimiter: passingLimiter(),
	emailCodeSendLimiter: passingLimiter(),
	emailCodeVerifyLimiter: passingLimiter(),
	refreshLimiter: passingLimiter(),
	aiLimiterPerMinute: passingLimiter(),
	aiLimiterPerMonth: passingLimiter(),
	githubRepoLimiter: passingLimiter(),
	githubInstallLimiter: passingLimiter(),
	githubCompareCommitsLimiter: passingLimiter(),
	inviteEmailLimiter: passingLimiter(),
}));

// ---------------------------------------------------------------------------
// GitHub fetch client — no real network calls in tests
// ---------------------------------------------------------------------------
vi.mock("@/lib/server/github/client", () => ({
	githubFetch: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Resend email — no real emails sent in tests
// ---------------------------------------------------------------------------
vi.mock("@/lib/server/resend", () => ({
	sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
	sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
	sendEmailCode: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

// Clean state before every test so each test is fully independent
beforeEach(async () => {
	await clearDatabase();
});

// Disconnect the Prisma client after all tests in the file are done
afterAll(async () => {
	await testPrisma.$disconnect();
});
