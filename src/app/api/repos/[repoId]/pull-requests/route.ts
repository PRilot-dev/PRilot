import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/db";
import { prisma } from "@/db";
import { uuidParam } from "@/lib/schemas/id.schema";
import { NotFoundError, UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

interface Deps {
	prisma: PrismaClient;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { prisma, getCurrentUser: defaultGetCurrentUser };

export function createGetHandler(deps: Deps = defaultDeps) {
	return async (
		_req: Request,
		context: { params: Promise<{ repoId: string }> },
	) => {
		try {
			// 1. Find user and get repoId param
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			const { repoId } = await uuidParam("repoId").parseAsync(await context.params);

			// 2. Get pagination query
			const url = new URL(_req.url);
			const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10), 1);
			const perPage = Math.min(
				Math.max(parseInt(url.searchParams.get("per_page") ?? "10", 10), 1),
				100,
			);
			const skip = (page - 1) * perPage;

			// 3. Get and validate status filter
			const statusParam = url.searchParams.get("status");
			const statusFilter = statusParam
				? z.enum(["draft", "sent", "all"]).catch("all").parse(statusParam)
				: null;

			// 4. Check repo for membership
			const repo = await deps.prisma.repository.findUnique({
				where: { id: repoId },
				include: { members: true },
			});
			if (!repo || repo.status === "deleted")
				throw new NotFoundError("Repository not found");

			const membership = repo.members.find((m) => m.userId === user.id);
			if (!membership)
				throw new NotFoundError("Repository not found or unauthorized");

			// 5. Build PR filter
			const baseFilter: Prisma.PullRequestWhereInput = { repositoryId: repo.id, createdById: user.id };

			const prFilter: Prisma.PullRequestWhereInput =
				statusFilter && statusFilter !== "all"
					? { ...baseFilter, status: statusFilter }
					: baseFilter;

			// 6. Fetch PRs with pagination
			const [pullRequests, totalPRs] = await Promise.all([
				deps.prisma.pullRequest.findMany({
					where: prFilter,
					select: {
						id: true,
						title: true,
						status: true,
						baseBranch: true,
						compareBranch: true,
						updatedAt: true,
						providerPrUrl: true,
						mode: true,
					},
					orderBy: { updatedAt: "desc" },
					skip,
					take: perPage,
				}),
				deps.prisma.pullRequest.count({ where: prFilter }),
			]);

			return NextResponse.json({
				pullRequests,
				pagination: {
					page,
					perPage,
					total: totalPRs,
					totalPages: Math.ceil(totalPRs / perPage),
				},
			});
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
