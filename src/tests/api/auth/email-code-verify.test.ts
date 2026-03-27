import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPostHandler } from "@/app/api/auth/email-code/verify/route";
import { testPrisma } from "@/tests/db";
import { mockCacheProvider, passingLimiter } from "@/tests/helpers/deps";
import { buildRequest, parseJson } from "@/tests/helpers/request";

const cacheProvider = mockCacheProvider();

const POST = createPostHandler({
	prisma: testPrisma,
	emailCodeVerifyLimiter: passingLimiter(),
	cacheProvider,
});

const EMAIL = "user@example.com";
const CODE = "123456";
const CODE_HASH = crypto.createHash("sha256").update(CODE).digest("hex");

function seedRedisCode(
	email: string,
	overrides: { hash?: string; attempts?: number } = {},
) {
	cacheProvider._store.set(`auth:email-code:${email}`, {
		value: JSON.stringify({
			hash: overrides.hash ?? CODE_HASH,
			attempts: overrides.attempts ?? 0,
		}),
		expireAt: Date.now() + 600_000,
	});
}

describe("POST /api/auth/email-code/verify", () => {
	it("returns 200 and creates a new user when email is unknown", async () => {
		// ARRANGE
		seedRedisCode(EMAIL);
		const req = buildRequest("POST", "/api/auth/email-code/verify", {
			body: { email: EMAIL, code: CODE },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ message: "Signed in successfully", isNewUser: true });
		expect(data.user).toHaveProperty("email", EMAIL);

		const dbUser = await testPrisma.user.findUnique({ where: { email: EMAIL } });
		expect(dbUser).not.toBeNull();
	});

	it("returns 200 and signs in an existing user", async () => {
		// ARRANGE
		await testPrisma.user.create({
			data: { email: EMAIL, username: "existing", password: null },
		});
		seedRedisCode(EMAIL);
		const req = buildRequest("POST", "/api/auth/email-code/verify", {
			body: { email: EMAIL, code: CODE },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ message: "Signed in successfully", isNewUser: false });

		const users = await testPrisma.user.findMany({ where: { email: EMAIL } });
		expect(users).toHaveLength(1);
	});

	it("deletes the Redis code after successful verification", async () => {
		// ARRANGE
		seedRedisCode(EMAIL);
		const req = buildRequest("POST", "/api/auth/email-code/verify", {
			body: { email: EMAIL, code: CODE },
		});

		// ACT
		await POST(req);

		// ASSERT
		expect(cacheProvider._store.has(`auth:email-code:${EMAIL}`)).toBe(false);
	});

	it("returns 400 when code is incorrect", async () => {
		// ARRANGE
		seedRedisCode(EMAIL);
		const req = buildRequest("POST", "/api/auth/email-code/verify", {
			body: { email: EMAIL, code: "000000" },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Invalid or expired code" });
	});

	it("increments attempts on wrong code", async () => {
		// ARRANGE
		seedRedisCode(EMAIL, { attempts: 0 });
		const req = buildRequest("POST", "/api/auth/email-code/verify", {
			body: { email: EMAIL, code: "000000" },
		});

		// ACT
		await POST(req);

		// ASSERT
		const entry = cacheProvider._store.get(`auth:email-code:${EMAIL}`);
		const parsed = JSON.parse(entry!.value);
		expect(parsed.attempts).toBe(1);
	});

	it("returns 400 when max attempts are exceeded", async () => {
		// ARRANGE
		seedRedisCode(EMAIL, { attempts: 5 });
		const req = buildRequest("POST", "/api/auth/email-code/verify", {
			body: { email: EMAIL, code: CODE },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Invalid or expired code" });
	});

	it("returns 400 when no code exists in Redis", async () => {
		// ARRANGE — no seedRedisCode
		const req = buildRequest("POST", "/api/auth/email-code/verify", {
			body: { email: EMAIL, code: CODE },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Invalid or expired code" });
	});

	it("returns 422 when body is invalid", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/auth/email-code/verify", {
			body: { email: "not-an-email", code: "12" },
		});

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(422);
	});

	it("handles username collision for new users", async () => {
		// ARRANGE — create a user whose username matches the email prefix
		await testPrisma.user.create({
			data: { email: "other@test.com", username: "user", password: null },
		});
		seedRedisCode(EMAIL);
		const req = buildRequest("POST", "/api/auth/email-code/verify", {
			body: { email: EMAIL, code: CODE },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson<{ user: { username: string } }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.user.username).not.toBe("user");
		expect(data.user.username).toMatch(/^user\d{4}$/);
	});
});
