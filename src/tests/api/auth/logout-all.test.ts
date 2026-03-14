import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/logout-all/route";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { parseJson } from "@/tests/helpers/request";
import { mockUser } from "@/tests/helpers/user";

describe("POST /api/auth/logout-all", () => {
	async function seedUserWithTokens(tokenCount = 3) {
		const user = await testPrisma.user.create({
			data: {
				email: "user@example.com",
				username: "testuser",
				password: "hashed-password",
			},
		});
		for (let i = 0; i < tokenCount; i++) {
			await testPrisma.refreshToken.create({
				data: {
					token: `refresh-token-${i}`,
					userId: user.id,
					expiresAt: new Date(Date.now() + 86_400_000),
				},
			});
		}
		return user;
	}

	it("returns 200 and deletes all refresh tokens for the user", async () => {
		// ARRANGE
		const user = await seedUserWithTokens(3);
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: user.id }),
		);

		// ACT
		const res = await POST();
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ message: "All sessions terminated" });
		const remaining = await testPrisma.refreshToken.count({
			where: { userId: user.id },
		});
		expect(remaining).toBe(0);
	});

	it("returns 401 when unauthenticated", async () => {
		// ACT
		const res = await POST();
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "Unauthenticated" });
	});

	it("does not delete other users' refresh tokens", async () => {
		// ARRANGE
		const user = await seedUserWithTokens(1);
		const otherUser = await testPrisma.user.create({
			data: {
				email: "other@example.com",
				username: "otheruser",
				password: "hashed-password",
			},
		});
		await testPrisma.refreshToken.create({
			data: {
				token: "other-user-token",
				userId: otherUser.id,
				expiresAt: new Date(Date.now() + 86_400_000),
			},
		});
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: user.id }),
		);

		// ACT
		await POST();

		// ASSERT
		const otherTokens = await testPrisma.refreshToken.count({
			where: { userId: otherUser.id },
		});
		expect(otherTokens).toBe(1);
	});

	it("clears cookie headers in the response", async () => {
		// ARRANGE
		const user = await seedUserWithTokens(1);
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: user.id }),
		);

		// ACT
		const res = await POST();

		// ASSERT
		const setCookieHeader = res.headers.getSetCookie();
		expect(setCookieHeader.some((c: string) => c.startsWith("accessToken=;"))).toBe(true);
		expect(setCookieHeader.some((c: string) => c.startsWith("refreshToken=;"))).toBe(true);
	});
});
