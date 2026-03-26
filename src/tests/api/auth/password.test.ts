import { describe, expect, it, vi } from "vitest";
import { createPatchHandler, createPostHandler } from "@/app/api/auth/password/route";
import { verifyPassword } from "@/lib/server/password";
import { testPrisma } from "@/tests/db";
import { createMockGetCurrentUser, passingLimiter } from "@/tests/helpers/deps";
import { buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser } from "@/tests/helpers/user";

const mockGetCurrentUser = createMockGetCurrentUser();

const deps = {
	prisma: testPrisma,
	changePasswordLimiter: passingLimiter(),
	getCurrentUser: mockGetCurrentUser,
};

const PATCH = createPatchHandler(deps);
const POST = createPostHandler(deps);

describe("PATCH /api/auth/password (change password)", () => {
	const validBody = {
		currentPassword: "OldPassword1!",
		newPassword: "NewPassword1!",
		confirmPassword: "NewPassword1!",
	};

	async function seedUser(password: string | null = "hashed-password") {
		return testPrisma.user.create({
			data: {
				email: "user@example.com",
				username: "testuser",
				password,
			},
		});
	}

	it("returns 200 and updates the password", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const req = buildRequest("PATCH", "/api/auth/password", { body: validBody });

		// ACT
		const res = await PATCH(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ message: "Password updated successfully" });
	});

	it("invalidates all sessions after password change", async () => {
		// ARRANGE
		const user = await seedUser();
		await testPrisma.refreshToken.create({
			data: {
				token: "session-token",
				userId: user.id,
				expiresAt: new Date(Date.now() + 86_400_000),
			},
		});
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const req = buildRequest("PATCH", "/api/auth/password", { body: validBody });

		// ACT
		await PATCH(req);

		// ASSERT
		const remaining = await testPrisma.refreshToken.count({ where: { userId: user.id } });
		expect(remaining).toBe(0);
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const req = buildRequest("PATCH", "/api/auth/password", { body: validBody });

		// ACT
		const res = await PATCH(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "Unauthenticated" });
	});

	it("returns 400 when user has no password (OAuth-only)", async () => {
		// ARRANGE
		const user = await seedUser(null);
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const req = buildRequest("PATCH", "/api/auth/password", { body: validBody });

		// ACT
		const res = await PATCH(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "No password set on this account. Use the set password form instead." });
	});

	it("returns 400 when current password is incorrect", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		vi.mocked(verifyPassword).mockRejectedValueOnce(
			new (await import("@/lib/server/error")).BadRequestError("Incorrect current password"),
		);
		const req = buildRequest("PATCH", "/api/auth/password", { body: validBody });

		// ACT
		const res = await PATCH(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Incorrect current password" });
	});

	it("returns 400 when new passwords do not match", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const req = buildRequest("PATCH", "/api/auth/password", {
			body: { ...validBody, confirmPassword: "Mismatch1!" },
		});

		// ACT
		const res = await PATCH(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Passwords do not match" });
	});

	it("returns 422 when body is invalid", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const req = buildRequest("PATCH", "/api/auth/password", {
			body: { currentPassword: "x" },
		});

		// ACT
		const res = await PATCH(req);

		// ASSERT
		expect(res.status).toBe(422);
	});
});

describe("POST /api/auth/password (set password)", () => {
	const validBody = {
		password: "NewPassword1!",
		confirmPassword: "NewPassword1!",
	};

	async function seedOAuthUser() {
		return testPrisma.user.create({
			data: {
				email: "oauth@example.com",
				username: "oauthuser",
				password: null,
			},
		});
	}

	it("returns 200 and sets the password for an OAuth user", async () => {
		// ARRANGE
		const user = await seedOAuthUser();
		mockGetCurrentUser.mockResolvedValueOnce(
			mockUser({ id: user.id, hasPassword: false }),
		);
		const req = buildRequest("POST", "/api/auth/password", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ message: "Password set successfully" });
		const updated = await testPrisma.user.findUnique({ where: { id: user.id } });
		expect(updated?.password).not.toBeNull();
	});

	it("returns 400 when user already has a password", async () => {
		// ARRANGE
		const user = await testPrisma.user.create({
			data: {
				email: "user@example.com",
				username: "testuser",
				password: "existing-hash",
			},
		});
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const req = buildRequest("POST", "/api/auth/password", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Password already set. Use the change password form instead." });
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/auth/password", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "Unauthenticated" });
	});

	it("returns 400 when passwords do not match", async () => {
		// ARRANGE
		const user = await seedOAuthUser();
		mockGetCurrentUser.mockResolvedValueOnce(
			mockUser({ id: user.id, hasPassword: false }),
		);
		const req = buildRequest("POST", "/api/auth/password", {
			body: { ...validBody, confirmPassword: "Mismatch1!" },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Passwords do not match" });
	});

	it("returns 422 when body is invalid", async () => {
		// ARRANGE
		const user = await seedOAuthUser();
		mockGetCurrentUser.mockResolvedValueOnce(
			mockUser({ id: user.id, hasPassword: false }),
		);
		const req = buildRequest("POST", "/api/auth/password", {
			body: { password: "weak" },
		});

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(422);
	});
});
