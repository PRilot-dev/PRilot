import { NextResponse } from "next/server";
import z from "zod";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { uuidParam } from "@/lib/schemas/id.schema";
import {
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

interface Deps {
	prisma: PrismaClient;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { prisma, getCurrentUser: defaultGetCurrentUser };

// ======================================
// GET — Fetch block config for a repo
// ======================================
export function createGetHandler(deps: Deps = defaultDeps) {
	return async (
		_req: Request,
		context: { params: Promise<{ repoId: string }> },
	) => {
		try {
			// 1. Auth
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			// 2. Repo ID
			const { repoId } = await uuidParam("repoId").parseAsync(
				await context.params,
			);

			// 3. Fetch repo + verify membership
			const repo = await deps.prisma.repository.findUnique({
				where: { id: repoId },
				include: { members: true },
			});

			if (!repo || repo.status === "deleted")
				throw new NotFoundError("Repository not found");

			const isMember = repo.members.some((m) => m.userId === user.id);
			if (!isMember)
				throw new ForbiddenError(
					"You are not a member of this repository",
				);

			// 4. Fetch all block configs for this repo
			const repositoryBlocks =
				await deps.prisma.repositoryBlock.findMany({
					where: { repositoryId: repoId },
					include: {
						block: {
							select: {
								id: true,
								slug: true,
								name: true,
								description: true,
							},
						},
					},
					orderBy: { position: "asc" },
				});

			return NextResponse.json({ repositoryBlocks });
		} catch (error) {
			return handleError(error);
		}
	};
}

// ===========================================
// PUT — Save block config for a branch type
// ===========================================
const blockConfigSchema = z.object({
	branchType: z.string().min(1).max(50).default("default"),
	blocks: z.array(
		z.object({
			blockId: z.uuid(),
			position: z.number().int().min(0),
			detailLevel: z.number().int().min(1).max(3).default(2),
		}),
	),
});

export function createPutHandler(deps: Deps = defaultDeps) {
	return async (
		req: Request,
		context: { params: Promise<{ repoId: string }> },
	) => {
		try {
			// 1. Auth
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			// 2. Repo ID
			const { repoId } = await uuidParam("repoId").parseAsync(
				await context.params,
			);

			// 3. Fetch repo + verify ownership
			const repo = await deps.prisma.repository.findUnique({
				where: { id: repoId },
				include: { members: true },
			});

			if (!repo || repo.status === "deleted")
				throw new NotFoundError("Repository not found");

			const membership = repo.members.find(
				(m) => m.userId === user.id,
			);
			if (!membership)
				throw new ForbiddenError(
					"You are not a member of this repository",
				);
			if (membership.role !== "owner")
				throw new ForbiddenError(
					"Only the repository owner can configure PR templates",
				);

			// 4. Parse and validate body
			const body = await req.json();
			const { branchType, blocks } =
				await blockConfigSchema.parseAsync(body);

			// 5. Replace config for this branch type (delete + insert)
			await deps.prisma.$transaction(async (tx) => {
				await tx.repositoryBlock.deleteMany({
					where: { repositoryId: repoId, branchType },
				});

				if (blocks.length > 0) {
					await tx.repositoryBlock.createMany({
						data: blocks.map((b) => ({
							repositoryId: repoId,
							blockId: b.blockId,
							branchType,
							position: b.position,
							detailLevel: b.detailLevel,
						})),
					});
				}
			});

			// 6. Return updated config
			const updated = await deps.prisma.repositoryBlock.findMany({
				where: { repositoryId: repoId, branchType },
				include: {
					block: {
						select: {
							id: true,
							slug: true,
							name: true,
							description: true,
						},
					},
				},
				orderBy: { position: "asc" },
			});

			return NextResponse.json({ repositoryBlocks: updated });
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
export const PUT = createPutHandler();
