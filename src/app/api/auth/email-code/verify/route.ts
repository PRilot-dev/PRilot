import crypto from "node:crypto";
import { NextResponse } from "next/server";
import z from "zod";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { BadRequestError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { ICacheProvider, IRateLimiter } from "@/lib/server/interfaces";
import { getClientIp } from "@/lib/server/ip";
import { cacheProvider } from "@/lib/server/providers/cache";
import { emailCodeVerifyLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { createSession } from "@/lib/server/token";

interface Deps {
	prisma: PrismaClient;
	emailCodeVerifyLimiter: IRateLimiter;
	cacheProvider: ICacheProvider;
}

const defaultDeps: Deps = { prisma, emailCodeVerifyLimiter, cacheProvider };

const MAX_ATTEMPTS = 5;

const verifySchema = z.object({
	email: z.email(),
	code: z.string().length(6),
});

export function createPostHandler(deps: Deps = defaultDeps) {
	return async (req: Request) => {
		try {
			// 1. Rate limit by IP
			const ip = getClientIp(req);
			const limit = await deps.emailCodeVerifyLimiter.limit(
				`auth:email-code:verify:ip:${ip}`,
			);
			rateLimitOrThrow(limit);

			// 2. Validate body
			const { email, code } = await verifySchema.parseAsync(
				await req.json(),
			);

			// 3. Get stored code from Redis
			const redisKey = `auth:email-code:${email}`;
			const stored = await deps.cacheProvider.get<{
				hash: string;
				attempts: number;
			}>(redisKey);

			if (!stored || stored.attempts >= MAX_ATTEMPTS) {
				throw new BadRequestError("Invalid or expired code");
			}

			// 4. Increment attempts before comparing (prevents brute force)
			await deps.cacheProvider.set(
				redisKey,
				JSON.stringify({
					...stored,
					attempts: stored.attempts + 1,
				}),
				{ keepTtl: true },
			);

			// 5. Constant-time comparison of hashed code
			const inputHash = crypto
				.createHash("sha256")
				.update(code)
				.digest("hex");
			const storedHashBuf = Buffer.from(stored.hash, "hex");
			const inputHashBuf = Buffer.from(inputHash, "hex");

			if (
				storedHashBuf.length !== inputHashBuf.length ||
				!crypto.timingSafeEqual(storedHashBuf, inputHashBuf)
			) {
				throw new BadRequestError("Invalid or expired code");
			}

			// 6. Code is valid — delete it from Redis
			await deps.cacheProvider.del(redisKey);

			// 7. Find or create user
			let user = await deps.prisma.user.findUnique({
				where: { email },
				include: { oauthIds: true },
			});

			let isNewUser = false;

			if (!user) {
				isNewUser = true;

				// Derive username from email prefix
				const baseUsername = email.split("@")[0];
				let username = baseUsername;

				// Handle username collision
				const existing = await deps.prisma.user.findFirst({
					where: { username },
					select: { id: true },
				});
				if (existing) {
					username = `${baseUsername}${crypto.randomInt(1000, 10000)}`;
				}

				user = await deps.prisma.user.create({
					data: { email, username },
					include: { oauthIds: true },
				});
			}

			// 8. Build safe user response
			const { password: _password, oauthIds, ...safeUser } = user;
			const oauthProviders = oauthIds.map((o) => o.provider);

			// 9. Create session
			const response = NextResponse.json({
				message: "Signed in successfully",
				isNewUser,
				user: { ...safeUser, oauthProviders },
			});

			await createSession(response, user);

			return response;
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
