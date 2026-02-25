import { NextResponse } from "next/server";
import { getPrisma, type Prisma, type PullRequestStatus } from "@/db";
import { uuidParam } from "@/lib/schemas/id.schema";
import { NotFoundError, UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser } from "@/lib/server/session";

const prisma = getPrisma();

export async function GET(
	_req: Request,
	context: { params: Promise<{ repoId: string }> },
) {
	try {
		// 1. Find user and get repoId param
		const user = await getCurrentUser();
		if (!user) throw new UnauthorizedError("Unauthenticated");

		const { repoId } = await uuidParam("repoId").parseAsync(await context.params);

		// 2. Get pagination query
		const url = new URL(_req.url);
		const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10), 1);
		const perPage = Math.max(
			parseInt(url.searchParams.get("per_page") ?? "10", 10),
			1,
		);
		const skip = (page - 1) * perPage;

		// 3. Get filter from query
		const statusFilter = url.searchParams.get("status");

		// 4. Check repo for membership
		const repo = await prisma.repository.findUnique({
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
				? { ...baseFilter, status: statusFilter as PullRequestStatus }
				: baseFilter;

		// 6. Fetch PRs with pagination
		const [pullRequests, totalPRs] = await Promise.all([
			prisma.pullRequest.findMany({
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
			prisma.pullRequest.count({ where: prFilter }),
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
}
