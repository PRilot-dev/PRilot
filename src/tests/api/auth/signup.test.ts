import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/signup/route";
import { testPrisma } from "@/tests/db";
import { buildRequest, parseJson } from "@/tests/helpers/request";

describe("POST /api/auth/signup", () => {
	const validBody = {
		email: "newuser@example.com",
		username: "newuser",
		password: "Password123!",
		confirmPassword: "Password123!",
	};

	it("returns 201 and creates the user in the database", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/auth/signup", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(201);
		expect(data).toMatchObject({
			message: "Account created successfully",
			user: { email: validBody.email, username: validBody.username },
		});

		const dbUser = await testPrisma.user.findUnique({
			where: { email: validBody.email },
		});
		expect(dbUser).not.toBeNull();
		expect(dbUser?.username).toBe(validBody.username);
	});

	it("returns 400 when passwords do not match", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/auth/signup", {
			body: { ...validBody, confirmPassword: "WrongPassword!" },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Passwords do not match" });
	});

	it("returns 400 when email is already in use", async () => {
		// ARRANGE
		await testPrisma.user.create({
			data: {
				email: validBody.email,
				username: "existing",
				password: "hashedpassword",
			},
		});
		const req = buildRequest("POST", "/api/auth/signup", { body: validBody });

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Email is already in use" });
	});

	it("returns 422 when body is invalid", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/auth/signup", {
			body: { email: "not-an-email" },
		});

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(422);
	});
});
