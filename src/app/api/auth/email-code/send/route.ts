import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { emailSchema } from "@/lib/schemas/email.schema";
import { handleError } from "@/lib/server/handleError";
import type { ICacheProvider, IEmailProvider, IRateLimiter } from "@/lib/server/interfaces";
import { getClientIp } from "@/lib/server/ip";
import { cacheProvider } from "@/lib/server/providers/cache";
import { emailProvider } from "@/lib/server/providers/email";
import { emailCodeSendLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";

interface Deps {
	emailCodeSendLimiter: IRateLimiter;
	cacheProvider: ICacheProvider;
	emailProvider: IEmailProvider;
}

const defaultDeps: Deps = { emailCodeSendLimiter, cacheProvider, emailProvider };

const SUCCESS_MESSAGE = "If this email is valid, a code has been sent.";
const CODE_TTL_SECONDS = 600; // 10 minutes

export function createPostHandler(deps: Deps = defaultDeps) {
	return async (req: Request) => {
		try {
			// 1. Rate limit by IP
			const ip = getClientIp(req);
			const ipLimit = await deps.emailCodeSendLimiter.limit(
				`auth:email-code:send:ip:${ip}`,
			);
			rateLimitOrThrow(ipLimit);

			// 2. Validate body
			const { email } = await emailSchema.parseAsync(await req.json());

			// 3. Rate limit by email
			const emailLimit = await deps.emailCodeSendLimiter.limit(
				`auth:email-code:send:email:${email}`,
			);
			rateLimitOrThrow(emailLimit);

			// 4. Generate 6-digit code and hash it
			const code = crypto.randomInt(100_000, 1_000_000).toString();
			const hash = crypto
				.createHash("sha256")
				.update(code)
				.digest("hex");

			// 5. Store hashed code in Redis with attempt counter
			await deps.cacheProvider.set(
				`auth:email-code:${email}`,
				JSON.stringify({ hash, attempts: 0 }),
				{ ttlSeconds: CODE_TTL_SECONDS },
			);

			// 6. Send email
			await deps.emailProvider.sendVerificationCode({ to: email, code });

			return NextResponse.json({ message: SUCCESS_MESSAGE });
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
