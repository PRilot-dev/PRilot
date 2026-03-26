import crypto from "node:crypto";
import { NextResponse } from "next/server";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { emailSchema } from "@/lib/schemas/email.schema";
import { config } from "@/lib/server/config";
import { handleError } from "@/lib/server/handleError";
import type { IEmailProvider, IRateLimiter } from "@/lib/server/interfaces";
import { getClientIp } from "@/lib/server/ip";
import { emailProvider } from "@/lib/server/providers/email";
import { forgotPasswordLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";

interface Deps {
	prisma: PrismaClient;
	forgotPasswordLimiter: IRateLimiter;
	emailProvider: IEmailProvider;
}

const defaultDeps: Deps = { prisma, forgotPasswordLimiter, emailProvider };

const SUCCESS_MESSAGE =
	"If an account exists with this email, a reset link has been sent.";

export function createPostHandler(deps: Deps = defaultDeps) {
	return async (req: Request) => {
		try {
			// 1. Rate limit by IP
			const ip = getClientIp(req);
			const limit = await deps.forgotPasswordLimiter.limit(
				`auth:forgot-password:ip:${ip}`,
			);
			rateLimitOrThrow(limit);

			// 2. Validate body
			const { email } = await emailSchema.parseAsync(await req.json());

			// 3. Find user — always return success to prevent email enumeration
			const user = await deps.prisma.user.findUnique({
				where: { email },
				select: { id: true },
			});

			if (!user) {
				return NextResponse.json({ message: SUCCESS_MESSAGE });
			}

			// 4. Delete any existing reset tokens for this user
			await deps.prisma.passwordResetToken.deleteMany({
				where: { userId: user.id },
			});

			// 5. Generate token and create record (10 min expiry)
			const token = crypto.randomBytes(32).toString("hex");
			await deps.prisma.passwordResetToken.create({
				data: {
					userId: user.id,
					token,
					expiresAt: new Date(Date.now() + 10 * 60 * 1000),
				},
			});

			// 6. Send email
			const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
			await deps.emailProvider.sendPasswordReset({ to: email, resetUrl });

			return NextResponse.json({ message: SUCCESS_MESSAGE });
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
