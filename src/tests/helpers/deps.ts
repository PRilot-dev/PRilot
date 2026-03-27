/**
 * Shared dependency helpers for API test files.
 *
 * These create mock implementations of the provider interfaces
 * that can be injected into route handler factories.
 */

import { vi } from "vitest";
import type {
	IAIProvider,
	ICacheProvider,
	IEmailProvider,
	IGitProviderApi,
	IGitProviderApp,
	IOAuthProvider,
	IRateLimiter,
} from "@/lib/server/interfaces";

/**
 * A mock getCurrentUser that returns null (unauthenticated) by default.
 * Override per-test: mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }))
 */
export function createMockGetCurrentUser() {
	return vi.fn().mockResolvedValue(null);
}

export function passingLimiter(): IRateLimiter {
	return {
		limit: vi
			.fn()
			.mockResolvedValue({ success: true, reset: Date.now() + 60_000, remaining: 9 }),
		getRemaining: vi
			.fn()
			.mockResolvedValue({ remaining: 25, reset: Date.now() + 60_000, limit: 30 }),
	};
}

export function mockEmailProvider(): IEmailProvider {
	return {
		sendVerificationCode: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendPasswordReset: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendRepoInvite: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendMemberJoined: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendMemberRemoved: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendMemberLeft: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendInvitationDeclined: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
	};
}

export function mockGitApiProvider(): IGitProviderApi {
	return {
		listRepositories: vi.fn().mockResolvedValue({ totalCount: 0, repositories: [] }),
		listBranches: vi.fn().mockResolvedValue([]),
		getCommitCount: vi.fn().mockResolvedValue(0),
		compareBranches: vi.fn().mockResolvedValue({ commits: [], files: [] }),
		createPullRequest: vi.fn().mockResolvedValue({
			url: "https://github.com/test/repo/pull/1",
			number: 1,
			state: "open",
		}),
	};
}

export function mockGitAppProvider(): IGitProviderApp {
	return {
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
	};
}

export function mockOAuthProvider(): IOAuthProvider {
	return {
		exchangeCodeForToken: vi.fn().mockResolvedValue({ accessToken: "mock-gh-token" }),
		getUserProfile: vi.fn().mockResolvedValue({
			providerUserId: "12345",
			login: "testuser",
			email: "test@example.com",
		}),
	};
}

export function mockAIProvider(): IAIProvider {
	return {
		createStreamingCompletion: vi.fn(),
	};
}

export function mockCacheProvider(): ICacheProvider & { _store: Map<string, { value: string; expireAt?: number }> } {
	const store = new Map<string, { value: string; expireAt?: number }>();
	return {
		get: vi.fn().mockImplementation((key: string) => {
			const entry = store.get(key);
			if (!entry) return Promise.resolve(null);
			if (entry.expireAt && entry.expireAt < Date.now()) {
				store.delete(key);
				return Promise.resolve(null);
			}
			try {
				return Promise.resolve(JSON.parse(entry.value));
			} catch {
				return Promise.resolve(entry.value);
			}
		}),
		set: vi.fn().mockImplementation(
			(key: string, value: unknown, opts?: { ttlSeconds?: number; keepTtl?: boolean }) => {
				const existing = store.get(key);
				const expireAt =
					opts?.keepTtl && existing?.expireAt
						? existing.expireAt
						: opts?.ttlSeconds
							? Date.now() + opts.ttlSeconds * 1000
							: undefined;
				store.set(key, {
					value: typeof value === "string" ? value : JSON.stringify(value),
					expireAt,
				});
				return Promise.resolve();
			},
		),
		del: vi.fn().mockImplementation((key: string) => {
			store.delete(key);
			return Promise.resolve();
		}),
		_store: store,
	} as ICacheProvider & { _store: Map<string, { value: string; expireAt?: number }> };
}
