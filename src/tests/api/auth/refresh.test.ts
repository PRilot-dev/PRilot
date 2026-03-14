import { cookies } from "next/headers";
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/refresh/route";
import { testPrisma } from "@/tests/db";
import { parseJson } from "@/tests/helpers/request";

describe("POST /api/auth/refresh", () => {
	async function seedUserWithToken(
		overrides: { expiresAt?: Date } = {},
	) {
		const user = await testPrisma.user.create({
			data: {
				email: "user@example.com",
				username: "testuser",
				password: "hashed-password",
			},
		});
		const token = await testPrisma.refreshToken.create({
			data: {
				token: "valid-refresh-token",
				userId: user.id,
				expiresAt: overrides.expiresAt ?? new Date(Date.now() + 86_400_000),
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

	it("returns 200 and rotates the refresh token", async () => {
		// ARRANGE
		const { token } = await seedUserWithToken();
		mockCookiesWith(token.token);

		// ACT
		const res = await POST();
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ success: true });

		const oldToken = await testPrisma.refreshToken.findUnique({
			where: { token: token.token },
		});
		expect(oldToken).toBeNull();
	});

	it("returns 401 when no refresh token cookie is present", async () => {
		// ARRANGE
		mockCookiesWith(undefined);

		// ACT
		const res = await POST();
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "No refresh token" });
	});

	it("returns 401 when refresh token is not in DB", async () => {
		// ARRANGE
		mockCookiesWith("nonexistent-token");

		// ACT
		const res = await POST();
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "Refresh token expired" });
	});

	it("returns 401 when refresh token is expired", async () => {
		// ARRANGE
		const { token } = await seedUserWithToken({
			expiresAt: new Date(Date.now() - 1000),
		});
		mockCookiesWith(token.token);

		// ACT
		const res = await POST();
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "Refresh token expired" });
	});

});
