import { NextResponse } from "next/server";
import { getPrisma } from "@/db";
import { resetPasswordSchema } from "@/lib/schemas/auth.schema";
import { BadRequestError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getClientIp } from "@/lib/server/ip";
import { hashPassword } from "@/lib/server/password";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { resetPasswordLimiter } from "@/lib/server/providers/rate-limiters";

const prisma = getPrisma();

export async function POST(req: Request) {
	try {
		// 1. Rate limit by IP
		const ip = getClientIp(req);
		const limit = await resetPasswordLimiter.limit(
			`auth:reset-password:ip:${ip}`,
		);
		rateLimitOrThrow(limit);

		// 2. Validate body
		const { token, password, confirmPassword } =
			await resetPasswordSchema.parseAsync(await req.json());

		// 3. Find token
		const resetToken = await prisma.passwordResetToken.findUnique({
			where: { token },
		});

		if (!resetToken) {
			throw new BadRequestError("Invalid or expired reset link");
		}

		// 4. Check expiration
		if (resetToken.expiresAt < new Date()) {
			await prisma.passwordResetToken.delete({
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
		await prisma.user.update({
			where: { id: resetToken.userId },
			data: { password: hashedPassword },
		});

		// 7. Delete used token
		await prisma.passwordResetToken.delete({
			where: { id: resetToken.id },
		});

		return NextResponse.json({ message: "Password reset successfully" });
	} catch (error) {
		return handleError(error);
	}
}
