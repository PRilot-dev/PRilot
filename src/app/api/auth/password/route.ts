import { NextResponse } from "next/server";
import { getPrisma } from "@/db";
import {
	changePasswordSchema,
	setPasswordSchema,
} from "@/lib/schemas/auth.schema";
import { BadRequestError, UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { changePasswordLimiter } from "@/lib/server/redis/rate-limiters";
import { getCurrentUser } from "@/lib/server/session";

const prisma = getPrisma();

// ======================================
// PATCH – Change password (has password)
// ======================================
export async function PATCH(req: Request) {
	try {
		// 1. Authenticate
		const user = await getCurrentUser();
		if (!user) throw new UnauthorizedError("Unauthenticated");

		// 2. Rate limit
		const limit = await changePasswordLimiter.limit(
			`auth:change-password:${user.id}`,
		);
		rateLimitOrThrow(limit);

		// 3. Validate body
		const { currentPassword, newPassword, confirmPassword } =
			await changePasswordSchema.parseAsync(await req.json());

		// 4. Fetch user with password
		const dbUser = await prisma.user.findUnique({
			where: { id: user.id },
			select: { password: true },
		});

		if (!dbUser?.password) {
			throw new BadRequestError(
				"No password set on this account. Use POST to set one.",
			);
		}

		// 5. Verify current password
		await verifyPassword(dbUser.password, currentPassword, "Incorrect current password");

		// 6. Check new passwords match
		if (newPassword !== confirmPassword) {
			throw new BadRequestError("Passwords do not match");
		}

		// 7. Update password
		const hashedPassword = await hashPassword(newPassword);
		await prisma.user.update({
			where: { id: user.id },
			data: { password: hashedPassword },
		});

		// 8. Invalidate all sessions (force re-login on all devices)
		await prisma.refreshToken.deleteMany({
			where: { userId: user.id },
		});

		return NextResponse.json({ message: "Password updated successfully" });
	} catch (error) {
		return handleError(error);
	}
}

// =============================================
// POST – Set password (OAuth user, no password)
// =============================================
export async function POST(req: Request) {
	try {
		// 1. Authenticate
		const user = await getCurrentUser();
		if (!user) throw new UnauthorizedError("Unauthenticated");

		// 2. Rate limit
		const limit = await changePasswordLimiter.limit(
			`auth:set-password:${user.id}`,
		);
		rateLimitOrThrow(limit);

		// 3. Validate body
		const { password, confirmPassword } =
			await setPasswordSchema.parseAsync(await req.json());

		// 4. Ensure user has no password yet
		const dbUser = await prisma.user.findUnique({
			where: { id: user.id },
			select: { password: true },
		});

		if (dbUser?.password) {
			throw new BadRequestError(
				"Password already set. Use PATCH to change it.",
			);
		}

		// 5. Check passwords match
		if (password !== confirmPassword) {
			throw new BadRequestError("Passwords do not match");
		}

		// 6. Set password
		const hashedPassword = await hashPassword(password);
		await prisma.user.update({
			where: { id: user.id },
			data: { password: hashedPassword },
		});

		return NextResponse.json({ message: "Password set successfully" });
	} catch (error) {
		return handleError(error);
	}
}
