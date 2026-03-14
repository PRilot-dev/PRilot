import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/login/route";
import { verifyPassword } from "@/lib/server/password";
import { testPrisma } from "@/tests/db";
import { buildRequest, parseJson } from "@/tests/helpers/request";

describe("POST /api/auth/login", () => {
	const validBody = {
		email: "user@example.com",
		password: "Password123!",
	};

	async function seedUser(
		overrides: { email?: string; password?: string | null } = {},
	) {
		return testPrisma.user.create({
			data: {
				email: overrides.email ?? validBody.email,
				username: "testuser",
				password:
					overrides.password !== undefined
						? overrides.password
						: "hashed-password",
			},
		});
	}

	it("returns 200 and the user on valid credentials", async () => {
		// ARRANGE
		await seedUser();
		const req = buildRequest("POST", "/api/auth/login", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({
			message: "Logged in successfully",
			user: { email: validBody.email },
		});
		expect(data.user).not.toHaveProperty("password");
	});

	it("returns 400 when email does not exist", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/auth/login", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Email and password do not match" });
	});

	it("returns 400 when user has no password (OAuth-only account)", async () => {
		// ARRANGE
		await seedUser({ password: null });
		const req = buildRequest("POST", "/api/auth/login", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Email and password do not match" });
	});

	it("returns 400 when password is incorrect", async () => {
		// ARRANGE
		await seedUser();
		vi.mocked(verifyPassword).mockRejectedValueOnce(
			new (await import("@/lib/server/error")).BadRequestError(
				"Email and password do not match",
			),
		);
		const req = buildRequest("POST", "/api/auth/login", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Email and password do not match" });
	});

	it("returns 422 when body is invalid", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/auth/login", {
			body: { email: "not-an-email" },
		});

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(422);
	});

	it("includes oauthProviders in the response", async () => {
		// ARRANGE
		const user = await seedUser();
		await testPrisma.userOAuth.create({
			data: {
				userId: user.id,
				provider: "github",
				providerUserId: "gh-12345",
			},
		});
		const req = buildRequest("POST", "/api/auth/login", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = (await res.json()) as { user: { oauthProviders: string[] } };

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.user.oauthProviders).toEqual(["github"]);
	});
});
