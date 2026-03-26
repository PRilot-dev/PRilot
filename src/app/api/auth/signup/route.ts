import { NextResponse } from "next/server";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { signupSchema } from "@/lib/schemas/auth.schema";
import { BadRequestError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { IRateLimiter } from "@/lib/server/interfaces";
import { getClientIp } from "@/lib/server/ip";
import { hashPassword } from "@/lib/server/password";
import { signupLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { createSession } from "@/lib/server/token";

interface Deps {
	prisma: PrismaClient;
	signupLimiter: IRateLimiter;
}

const defaultDeps: Deps = { prisma, signupLimiter };

export function createPostHandler(deps: Deps = defaultDeps) {
	return async (req: Request) => {
		try {
			// 1. Get client IP
			const ip = getClientIp(req);

			// 2. Rate limiting (IP-only)
			const limit = await deps.signupLimiter.limit(
				`auth:signup:ip:${ip}`,
			);
			rateLimitOrThrow(limit);

			// 3. Parse + validate body
			const body = await req.json();
			const { email, username, password, confirmPassword } =
				await signupSchema.parseAsync(body);

			// 4. Check password confirmation
			if (password !== confirmPassword) {
				throw new BadRequestError("Passwords do not match");
			}

			// 5. Check if user already exists
			const existingUser = await deps.prisma.user.findUnique({
				where: { email },
			});

			if (existingUser) {
				throw new BadRequestError("Email is already in use");
			}

			// 6. Hash password
			const hashedPassword = await hashPassword(password);

			// 7. Create user
			const user = await deps.prisma.user.create({
				data: {
					email,
					username,
					password: hashedPassword,
				},
				include: {
					oauthIds: true,
				},
			});

			// 8. Remove sensitive info
			const { password: _password, oauthIds, ...safeUser } = user;
			const oauthProviders = oauthIds.map((o) => o.provider);

			// 9. Create response + session
			const response = NextResponse.json(
				{
					message: "Account created successfully",
					user: {
						...safeUser,
						oauthProviders,
					},
				},
				{ status: 201 },
			);

			await createSession(response, user);

			return response;
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
