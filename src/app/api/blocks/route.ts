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

export function createGetHandler(deps: Deps = defaultDeps) {
	return async () => {
		try {
			// 1. Auth
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			// 2. Fetch all block definitions
			const blocks = await deps.prisma.block.findMany({
				orderBy: { createdAt: "asc" },
				select: {
					id: true,
					slug: true,
					name: true,
					description: true,
				},
			});

			return NextResponse.json({ blocks });
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
