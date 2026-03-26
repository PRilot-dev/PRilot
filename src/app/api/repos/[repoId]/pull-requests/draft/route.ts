import { type NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { uuidParam } from "@/lib/schemas/id.schema";
import { createPrSchema } from "@/lib/schemas/pr.schema";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

interface Deps {
	prisma: PrismaClient;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { prisma, getCurrentUser: defaultGetCurrentUser };

export function createPostHandler(deps: Deps = defaultDeps) {
	return async (
		req: NextRequest,
		context: { params: Promise<{ repoId: string }> },
	) => {
		try {
			// 1. Find user
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			// 2. Get repository ID
			const { repoId } = await uuidParam("repoId").parseAsync(
				await context.params,
			);

			// 3. Check if user is a member of this repo
			const repo = await deps.prisma.repository.findUnique({
				where: { id: repoId },
				include: { members: true },
			});

			if (!repo || repo.status === "deleted")
				throw new NotFoundError("Repository not found");

			const isMember = repo.members.some((m) => m.userId === user.id);
			if (!isMember) {
				throw new ForbiddenError("You are not a member of this repository");
			}

			// 4. Validate inputs
			const { prTitle, prBody, baseBranch, compareBranch, language, mode } =
				await createPrSchema.parseAsync(await req.json());

			// 5. Insert new PR
			const pr = await deps.prisma.pullRequest.create({
				data: {
					repositoryId: repoId,
					title: sanitizeHtml(prTitle),
					description: sanitizeHtml(prBody),
					baseBranch,
					compareBranch,
					createdById: user.id,
					language: language,
					mode: mode
				},
			});

			return NextResponse.json(
				{
					id: pr.id,
					title: pr.title,
					status: pr.status,
					baseBranch: pr.baseBranch,
					compareBranch: pr.compareBranch,
					mode: mode,
					createdAt: pr.createdAt,
				},
				{ status: 201 },
			);
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
