import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { handleError } from "@/lib/server/handleError";

interface Deps {
	prisma: PrismaClient;
}

const defaultDeps: Deps = { prisma };

export function createPostHandler(deps: Deps = defaultDeps) {
	return async () => {
		try {
			// Delete only the current session's refresh token
			const cookieStore = await cookies();
			const refreshToken = cookieStore.get("refreshToken")?.value;

			if (refreshToken) {
				await deps.prisma.refreshToken
					.delete({
						where: { token: refreshToken },
					})
					.catch(() => {});
			}

			// Clear cookies
			const response = new NextResponse(null, { status: 204 });

			response.cookies.set("accessToken", "", {
				maxAge: 0,
				path: "/",
			});

			response.cookies.set("refreshToken", "", {
				maxAge: 0,
				path: "/",
			});

			response.cookies.set("github_oauth_state", "", {
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
