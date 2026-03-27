import { describe, expect, it } from "vitest";
import { createPostHandler } from "@/app/api/auth/email-code/send/route";
import { mockCacheProvider, mockEmailProvider, passingLimiter } from "@/tests/helpers/deps";
import { buildRequest, parseJson } from "@/tests/helpers/request";

const cacheProvider = mockCacheProvider();
const emailProvider = mockEmailProvider();

const POST = createPostHandler({
	emailCodeSendLimiter: passingLimiter(),
	cacheProvider,
	emailProvider,
});

const SUCCESS_MESSAGE = "If this email is valid, a code has been sent.";

describe("POST /api/auth/email-code/send", () => {
	it("returns 200 and stores a hashed code in Redis", async () => {
		// ARRANGE
		const email = "user@example.com";
		const req = buildRequest("POST", "/api/auth/email-code/send", {
			body: { email },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ message: SUCCESS_MESSAGE });

		const entry = cacheProvider._store.get(`auth:email-code:${email}`);
		expect(entry).toBeDefined();
		const parsed = JSON.parse(entry!.value);
		expect(parsed.hash).toMatch(/^[a-f0-9]{64}$/);
		expect(parsed.attempts).toBe(0);
	});

	it("sends a verification email", async () => {
		// ARRANGE
		const email = "user@example.com";
		const req = buildRequest("POST", "/api/auth/email-code/send", {
			body: { email },
		});

		// ACT
		await POST(req);

		// ASSERT
		expect(emailProvider.sendVerificationCode).toHaveBeenCalledOnce();
		expect(emailProvider.sendVerificationCode).toHaveBeenCalledWith(
			expect.objectContaining({ to: email, code: expect.stringMatching(/^\d{6}$/) }),
		);
	});

	it("overwrites a previous code for the same email", async () => {
		// ARRANGE
		const email = "user@example.com";
		cacheProvider._store.set(`auth:email-code:${email}`, {
			value: JSON.stringify({ hash: "old-hash", attempts: 3 }),
			expireAt: Date.now() + 600_000,
		});
		const req = buildRequest("POST", "/api/auth/email-code/send", {
			body: { email },
		});

		// ACT
		await POST(req);

		// ASSERT
		const entry = cacheProvider._store.get(`auth:email-code:${email}`);
		const parsed = JSON.parse(entry!.value);
		expect(parsed.hash).not.toBe("old-hash");
		expect(parsed.attempts).toBe(0);
	});

	it("returns 422 when email is invalid", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/auth/email-code/send", {
			body: { email: "not-an-email" },
		});

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(422);
	});
});
