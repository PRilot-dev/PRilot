/**
 * Reusable helpers for mocking GitHub **OAuth** API responses in tests.
 *
 * This is separate from the `mocks/github.ts` vi.mock which replaces the
 * internal `@/lib/server/github/client` (`githubFetch`) wrapper used by most
 * routes. The OAuth callback route calls `globalThis.fetch` directly to hit
 * GitHub's token exchange and user endpoints, so we need a fetch-level spy.
 *
 * Usage:
 *   import { mockGitHubApiFetch, GITHUB_USER, restoreFetchSpy } from "@/tests/helpers/github"
 *
 *   fetchSpy = mockGitHubApiFetch();                       // defaults
 *   fetchSpy = mockGitHubApiFetch({ accessToken: null });  // token exchange fails
 *
 *   afterEach(() => restoreFetchSpy());
 */

import { vi } from "vitest";

export const GITHUB_USER = {
	id: 12345,
	login: "ghuser",
	email: "ghuser@example.com",
} as const;

type MockGitHubFetchOptions = {
	accessToken?: string | null;
	user?: { id?: number; login?: string; email?: string | null };
	emails?: { email: string; primary: boolean; verified: boolean }[];
};

let _fetchSpy: ReturnType<typeof vi.spyOn> | undefined;

/**
 * Spy on `globalThis.fetch` and queue GitHub API responses in order:
 *   1. Token exchange  (`POST /login/oauth/access_token`)
 *   2. User profile    (`GET /user`)
 *   3. User emails     (`GET /user/emails`) — only when `user.email` is null and `emails` is provided
 *
 * Returns the spy for additional assertions (e.g. `expect(spy).toHaveBeenCalledTimes(2)`).
 */
export function mockGitHubApiFetch(overrides: MockGitHubFetchOptions = {}) {
	const {
		accessToken = "gh-access-token",
		user = { id: GITHUB_USER.id, login: GITHUB_USER.login, email: GITHUB_USER.email },
		emails,
	} = overrides;

	const spy = vi.spyOn(globalThis, "fetch");
	_fetchSpy = spy;

	// 1. Token exchange
	spy.mockResolvedValueOnce(
		Response.json(
			accessToken
				? { access_token: accessToken }
				: { error: "bad_verification_code" },
		),
	);

	// 2. /user
	spy.mockResolvedValueOnce(Response.json(user));

	// 3. /user/emails (only when user.email is null)
	if (user.email === null && emails) {
		spy.mockResolvedValueOnce(Response.json(emails));
	}

	return spy;
}

/**
 * Restore the fetch spy created by `mockGitHubApiFetch`.
 * Call this in `afterEach` to avoid leaking mocks between tests.
 */
export function restoreFetchSpy() {
	_fetchSpy?.mockRestore();
	_fetchSpy = undefined;
}
