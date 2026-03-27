import { describe, expect, it } from "vitest";
import { createPostHandler } from "@/app/api/auth/forgot-password/route";
import { testPrisma } from "@/tests/db";
import { mockEmailProvider, passingLimiter } from "@/tests/helpers/deps";
import { buildRequest, parseJson } from "@/tests/helpers/request";

const emailProvider = mockEmailProvider();

const POST = createPostHandler({
	prisma: testPrisma,
	forgotPasswordLimiter: passingLimiter(),
	emailProvider,
});

const SUCCESS_MESSAGE = "If an account exists with this email, a reset link has been sent.";

describe("POST /api/auth/forgot-password", () => {
	async function seedUser(email = "user@example.com") {
		return testPrisma.user.create({
			data: { email, username: "testuser", password: "hashed-password" },
		});
	}

	it("returns 200 and creates a reset token when user exists", async () => {
		// ARRANGE
		const user = await seedUser();
		const req = buildRequest("POST", "/api/auth/forgot-password", {
			body: { email: user.email },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ message: SUCCESS_MESSAGE });
		const token = await testPrisma.passwordResetToken.findFirst({
			where: { userId: user.id },
		});
		expect(token).not.toBeNull();
		expect(emailProvider.sendPasswordReset).toHaveBeenCalledOnce();
	});

	it("returns 200 with the same message when user does not exist", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/auth/forgot-password", {
			body: { email: "nobody@example.com" },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ message: SUCCESS_MESSAGE });
		expect(emailProvider.sendPasswordReset).not.toHaveBeenCalled();
	});

	it("deletes existing reset tokens before creating a new one", async () => {
		// ARRANGE
		const user = await seedUser();
		await testPrisma.passwordResetToken.create({
			data: {
				token: "a".repeat(64),
				userId: user.id,
				expiresAt: new Date(Date.now() + 600_000),
			},
		});
		const req = buildRequest("POST", "/api/auth/forgot-password", {
			body: { email: user.email },
		});

		// ACT
		await POST(req);

		// ASSERT
		const tokens = await testPrisma.passwordResetToken.findMany({
			where: { userId: user.id },
		});
		expect(tokens).toHaveLength(1);
		expect(tokens[0].token).not.toBe("a".repeat(64));
	});

	it("returns 422 when email is invalid", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/auth/forgot-password", {
			body: { email: "not-an-email" },
		});

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(422);
	});
});
