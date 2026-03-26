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
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			// Fetch installations created by this user
			const installations = await deps.prisma.providerInstallation.findMany({
				where: { createdById: user.id },
				select: {
					id: true,
					provider: true,
					installationId: true,
					accountLogin: true,
					accountType: true,
				},
			});

			return NextResponse.json({ installations });
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
