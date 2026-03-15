import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Redis client — in-memory Map that mimics Upstash Redis for tests.
// The store is exported so tests can pre-populate or inspect values.
// ---------------------------------------------------------------------------
export const redisStore = new Map<string, { value: string; expireAt?: number }>();

vi.mock("@/lib/server/redis/client", () => ({
	redis: {
		set: vi.fn().mockImplementation(
			(key: string, value: string, opts?: { ex?: number; keepTtl?: boolean }) => {
				const existing = redisStore.get(key);
				const expireAt =
					opts?.keepTtl && existing?.expireAt
						? existing.expireAt
						: opts?.ex
							? Date.now() + opts.ex * 1000
							: undefined;
				redisStore.set(key, { value, expireAt });
				return Promise.resolve("OK");
			},
		),
		get: vi.fn().mockImplementation((key: string) => {
			const entry = redisStore.get(key);
			if (!entry) return Promise.resolve(null);
			if (entry.expireAt && entry.expireAt < Date.now()) {
				redisStore.delete(key);
				return Promise.resolve(null);
			}
			try {
				return Promise.resolve(JSON.parse(entry.value));
			} catch {
				return Promise.resolve(entry.value);
			}
		}),
		del: vi.fn().mockImplementation((key: string) => {
			redisStore.delete(key);
			return Promise.resolve(1);
		}),
	},
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
		getRemaining: vi
			.fn()
			.mockResolvedValue({ remaining: 25, reset: Date.now() + 60_000, limit: 30 }),
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
