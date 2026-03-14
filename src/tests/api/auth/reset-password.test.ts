import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/reset-password/route";
import { testPrisma } from "@/tests/db";
import { buildRequest, parseJson } from "@/tests/helpers/request";

describe("POST /api/auth/reset-password", () => {
	const validToken = crypto.randomBytes(32).toString("hex"); // 64 chars

	async function seedUserWithResetToken(
		overrides: { expiresAt?: Date } = {},
	) {
		const user = await testPrisma.user.create({
			data: {
				email: "user@example.com",
				username: "testuser",
				password: "old-hashed-password",
			},
		});
		const resetToken = await testPrisma.passwordResetToken.create({
			data: {
				token: validToken,
				userId: user.id,
				expiresAt: overrides.expiresAt ?? new Date(Date.now() + 600_000),
			},
		});
		return { user, resetToken };
	}

	const validBody = {
		token: validToken,
		password: "NewPassword1!",
		confirmPassword: "NewPassword1!",
	};

	it("returns 200 and resets the password", async () => {
		// ARRANGE
		const { user } = await seedUserWithResetToken();
		const req = buildRequest("POST", "/api/auth/reset-password", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ message: "Password reset successfully" });
		const updated = await testPrisma.user.findUnique({ where: { id: user.id } });
		expect(updated?.password).not.toBe("old-hashed-password");
	});

	it("deletes the reset token after use", async () => {
		// ARRANGE
		await seedUserWithResetToken();
		const req = buildRequest("POST", "/api/auth/reset-password", { body: validBody });

		// ACT
		await POST(req);

		// ASSERT
		const remaining = await testPrisma.passwordResetToken.findUnique({
			where: { token: validToken },
		});
		expect(remaining).toBeNull();
	});

	it("returns 400 when token does not exist", async () => {
		// ARRANGE
		const fakeToken = crypto.randomBytes(32).toString("hex");
		const req = buildRequest("POST", "/api/auth/reset-password", {
			body: { ...validBody, token: fakeToken },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Invalid or expired reset link" });
	});

	it("returns 400 when token is expired", async () => {
		// ARRANGE
		await seedUserWithResetToken({ expiresAt: new Date(Date.now() - 1000) });
		const req = buildRequest("POST", "/api/auth/reset-password", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Invalid or expired reset link" });
	});

	it("returns 400 when passwords do not match", async () => {
		// ARRANGE
		await seedUserWithResetToken();
		const req = buildRequest("POST", "/api/auth/reset-password", {
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
		const req = buildRequest("POST", "/api/auth/reset-password", {
			body: { token: "too-short", password: "weak" },
		});

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(422);
	});
});
