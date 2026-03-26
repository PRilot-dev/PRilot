import { NextResponse } from "next/server";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { loginSchema } from "@/lib/schemas/auth.schema";
import { BadRequestError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { IRateLimiter } from "@/lib/server/interfaces";
import { getClientIp } from "@/lib/server/ip";
import { verifyPassword } from "@/lib/server/password";
import { loginLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { createSession } from "@/lib/server/token";

interface Deps {
	prisma: PrismaClient;
	loginLimiter: IRateLimiter;
}

const defaultDeps: Deps = { prisma, loginLimiter };

export function createPostHandler(deps: Deps = defaultDeps) {
	return async (req: Request) => {
		try {
			// 1. Get client IP
			const ip = getClientIp(req);

			// 2. Parse and validate body
			const body = await req.json();
			const { email, password } = await loginSchema.parseAsync(body);

			// 3. Rate limiting (IP + email)
			const ipLimit = await deps.loginLimiter.limit(
				`auth:login:ip:${ip}`,
			);
			rateLimitOrThrow(ipLimit);

			const emailLimit = await deps.loginLimiter.limit(
				`auth:login:email:${email}`,
			);
			rateLimitOrThrow(emailLimit);

			// 4. Find user
			const user = await deps.prisma.user.findUnique({
				where: { email },
				include: { oauthIds: true },
			});

			if (!user || !user.password) {
				throw new BadRequestError("Email and password do not match");
			}

			// 5. Verify password
			await verifyPassword(user.password, password);

			// 6. Remove sensitive info
			const { password: _password, oauthIds, ...safeUser } = user;
			const oauthProviders = oauthIds.map((o) => o.provider);

			// 7. Create response + session
			const response = NextResponse.json(
				{
					message: "Logged in successfully",
					user: {
						...safeUser,
						oauthProviders,
					},
				},
				{ status: 200 },
			);

			await createSession(response, user);

			return response;
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
