import { cookies } from "next/headers";
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/logout/route";
import { testPrisma } from "@/tests/db";

describe("POST /api/auth/logout", () => {
	async function seedUserWithToken() {
		const user = await testPrisma.user.create({
			data: {
				email: "user@example.com",
				username: "testuser",
				password: "hashed-password",
			},
		});
		const token = await testPrisma.refreshToken.create({
			data: {
				token: "refresh-token-abc",
				userId: user.id,
				expiresAt: new Date(Date.now() + 86_400_000),
			},
		});
		return { user, token };
	}

	function mockCookiesWith(refreshToken: string | undefined) {
		vi.mocked(cookies).mockResolvedValueOnce({
			get: vi.fn().mockImplementation((name: string) =>
				name === "refreshToken" && refreshToken
					? { name: "refreshToken", value: refreshToken }
					: undefined,
			),
			set: vi.fn(),
			delete: vi.fn(),
			has: vi.fn().mockReturnValue(false),
			getAll: vi.fn().mockReturnValue([]),
		} as never);
	}

	it("returns 204 and deletes the refresh token from DB", async () => {
		// ARRANGE
		const { token } = await seedUserWithToken();
		mockCookiesWith(token.token);

		// ACT
		const res = await POST();

		// ASSERT
		expect(res.status).toBe(204);
		const remaining = await testPrisma.refreshToken.findUnique({
			where: { token: token.token },
		});
		expect(remaining).toBeNull();
	});

	it("returns 204 and clears cookies even without a refresh token", async () => {
		// ARRANGE
		mockCookiesWith(undefined);

		// ACT
		const res = await POST();

		// ASSERT
		expect(res.status).toBe(204);
		const setCookieHeader = res.headers.getSetCookie();
		expect(setCookieHeader.some((c: string) => c.startsWith("accessToken=;"))).toBe(true);
		expect(setCookieHeader.some((c: string) => c.startsWith("refreshToken=;"))).toBe(true);
		expect(setCookieHeader.some((c: string) => c.startsWith("github_oauth_state=;"))).toBe(true);
	});

	it("returns 204 even if refresh token is not in DB", async () => {
		// ARRANGE
		mockCookiesWith("nonexistent-token");

		// ACT
		const res = await POST();

		// ASSERT
		expect(res.status).toBe(204);
	});

	it("does not delete other users' refresh tokens", async () => {
		// ARRANGE
		const { token } = await seedUserWithToken();
		const otherUser = await testPrisma.user.create({
			data: {
				email: "other@example.com",
				username: "otheruser",
				password: "hashed-password",
			},
		});
		const otherToken = await testPrisma.refreshToken.create({
			data: {
				token: "other-refresh-token",
				userId: otherUser.id,
				expiresAt: new Date(Date.now() + 86_400_000),
			},
		});
		mockCookiesWith(token.token);

		// ACT
		await POST();

		// ASSERT
		const remaining = await testPrisma.refreshToken.findUnique({
			where: { token: otherToken.token },
		});
		expect(remaining).not.toBeNull();
	});
});
