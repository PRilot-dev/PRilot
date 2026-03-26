import { NextResponse } from "next/server";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { resetPasswordSchema } from "@/lib/schemas/auth.schema";
import { BadRequestError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { IRateLimiter } from "@/lib/server/interfaces";
import { getClientIp } from "@/lib/server/ip";
import { hashPassword } from "@/lib/server/password";
import { resetPasswordLimiter } from "@/lib/server/providers/rate-limiters";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";

interface Deps {
	prisma: PrismaClient;
	resetPasswordLimiter: IRateLimiter;
}

const defaultDeps: Deps = { prisma, resetPasswordLimiter };

export function createPostHandler(deps: Deps = defaultDeps) {
	return async (req: Request) => {
		try {
			// 1. Rate limit by IP
			const ip = getClientIp(req);
			const limit = await deps.resetPasswordLimiter.limit(
				`auth:reset-password:ip:${ip}`,
			);
			rateLimitOrThrow(limit);

			// 2. Validate body
			const { token, password, confirmPassword } =
				await resetPasswordSchema.parseAsync(await req.json());

			// 3. Find token
			const resetToken = await deps.prisma.passwordResetToken.findUnique({
				where: { token },
			});

			if (!resetToken) {
				throw new BadRequestError("Invalid or expired reset link");
			}

			// 4. Check expiration
			if (resetToken.expiresAt < new Date()) {
				await deps.prisma.passwordResetToken.delete({
					where: { id: resetToken.id },
				});
				throw new BadRequestError("Invalid or expired reset link");
			}

			// 5. Check passwords match
			if (password !== confirmPassword) {
				throw new BadRequestError("Passwords do not match");
			}

			// 6. Hash and update password
			const hashedPassword = await hashPassword(password);
			await deps.prisma.user.update({
				where: { id: resetToken.userId },
				data: { password: hashedPassword },
			});

			// 7. Delete used token
			await deps.prisma.passwordResetToken.delete({
				where: { id: resetToken.id },
			});

			return NextResponse.json({
				message: "Password reset successfully",
			});
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
