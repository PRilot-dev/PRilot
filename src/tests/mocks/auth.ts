import { vi } from "vitest";

// Session — unauthenticated by default; override per-test with mockResolvedValue
vi.mock("@/lib/server/session", () => ({
	getCurrentUser: vi.fn().mockResolvedValue(null),
}));

// Token helpers — avoid real JWT signing and DB refresh-token writes
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

// Password — argon2 is intentionally slow; use instant stubs for test speed
vi.mock("@/lib/server/password", () => ({
	hashPassword: vi
		.fn()
		.mockResolvedValue("$argon2id$v=19$m=65536,t=3,p=4$mockhash"),
	verifyPassword: vi.fn().mockResolvedValue(true),
}));
