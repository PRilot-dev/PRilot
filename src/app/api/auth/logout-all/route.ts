import { NextResponse } from "next/server";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

interface Deps {
	prisma: PrismaClient;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { prisma, getCurrentUser: defaultGetCurrentUser };

export function createPostHandler(deps: Deps = defaultDeps) {
	return async () => {
		try {
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			// Delete all refresh tokens for this user
			await deps.prisma.refreshToken.deleteMany({
				where: { userId: user.id },
			});

			// Clear cookies on current device
			const response = NextResponse.json({
				message: "All sessions terminated",
			});

			response.cookies.set("accessToken", "", {
				maxAge: 0,
				path: "/",
			});

			response.cookies.set("refreshToken", "", {
				maxAge: 0,
				path: "/",
			});

			return response;
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
