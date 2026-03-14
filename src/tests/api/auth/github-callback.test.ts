import { cookies } from "next/headers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/github/callback/route";
import { testPrisma } from "@/tests/db";
import {
	GITHUB_USER,
	mockGitHubApiFetch,
	restoreFetchSpy,
} from "@/tests/helpers/github";
import { buildRequest, parseJson } from "@/tests/helpers/request";

const OAUTH_STATE = "valid-state-token";

function mockCookiesWithState(state: string | undefined) {
	vi.mocked(cookies).mockResolvedValueOnce({
		get: vi.fn().mockImplementation((name: string) =>
			name === "github_oauth_state" && state
				? { name: "github_oauth_state", value: state }
				: undefined,
		),
		set: vi.fn(),
		delete: vi.fn(),
		has: vi.fn().mockReturnValue(false),
		getAll: vi.fn().mockReturnValue([]),
	} as never);
}

afterEach(() => {
	restoreFetchSpy();
});

describe("POST /api/auth/github/callback", () => {
	const validBody = { code: "github-auth-code", state: OAUTH_STATE };

	it("creates a new user and returns 200 on first OAuth login", async () => {
		// ARRANGE
		mockCookiesWithState(OAUTH_STATE);
		mockGitHubApiFetch();
		const req = buildRequest("POST", "/api/auth/github/callback", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({
			success: true,
			message: "GitHub connected successfully",
		});
		expect(data).toHaveProperty("user");

		const dbUser = await testPrisma.user.findUnique({
			where: { email: GITHUB_USER.email },
			include: { oauthIds: true },
		});
		expect(dbUser).not.toBeNull();
		expect(dbUser?.oauthIds).toHaveLength(1);
		expect(dbUser?.oauthIds[0].provider).toBe("github");
	});

	it("links GitHub to an existing user matched by email", async () => {
		// ARRANGE
		const existing = await testPrisma.user.create({
			data: { email: GITHUB_USER.email, username: "existing", password: "hashed" },
		});
		mockCookiesWithState(OAUTH_STATE);
		mockGitHubApiFetch();
		const req = buildRequest("POST", "/api/auth/github/callback", { body: validBody });

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(200);
		const oauth = await testPrisma.userOAuth.findFirst({
			where: { userId: existing.id, provider: "github" },
		});
		expect(oauth).not.toBeNull();
	});

	it("logs in an existing OAuth user without creating duplicates", async () => {
		// ARRANGE
		const existing = await testPrisma.user.create({
			data: {
				email: GITHUB_USER.email,
				username: GITHUB_USER.login,
				oauthIds: {
					create: { provider: "github", providerUserId: GITHUB_USER.id.toString() },
				},
			},
		});
		mockCookiesWithState(OAUTH_STATE);
		mockGitHubApiFetch();
		const req = buildRequest("POST", "/api/auth/github/callback", { body: validBody });

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(200);
		const users = await testPrisma.user.findMany({ where: { email: GITHUB_USER.email } });
		expect(users).toHaveLength(1);
		expect(users[0].id).toBe(existing.id);
	});

	it("resolves email from /user/emails when user profile has no email", async () => {
		// ARRANGE
		mockCookiesWithState(OAUTH_STATE);
		mockGitHubApiFetch({
			user: { id: GITHUB_USER.id, login: GITHUB_USER.login, email: null },
			emails: [
				{ email: "secondary@example.com", primary: false, verified: true },
				{ email: GITHUB_USER.email, primary: true, verified: true },
			],
		});
		const req = buildRequest("POST", "/api/auth/github/callback", { body: validBody });

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(200);
		const dbUser = await testPrisma.user.findUnique({ where: { email: GITHUB_USER.email } });
		expect(dbUser).not.toBeNull();
	});

	it("returns 400 when code or state is missing", async () => {
		// ARRANGE — no cookie mock needed: route exits before calling cookies()
		const req = buildRequest("POST", "/api/auth/github/callback", {
			body: { code: "some-code" },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Missing code or state" });
	});

	it("returns 400 when OAuth state does not match cookie", async () => {
		// ARRANGE
		mockCookiesWithState("different-state");
		const req = buildRequest("POST", "/api/auth/github/callback", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Invalid OAuth state" });
	});

	it("returns 401 when GitHub token exchange fails", async () => {
		// ARRANGE
		mockCookiesWithState(OAUTH_STATE);
		mockGitHubApiFetch({ accessToken: null });
		const req = buildRequest("POST", "/api/auth/github/callback", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "Failed to get access token" });
	});
});
