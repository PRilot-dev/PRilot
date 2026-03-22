import { type NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/db";
import { uuidParam } from "@/lib/schemas/id.schema";
import {
	BadRequestError,
	ForbiddenError,
	GitHubApiError,
	NotFoundError,
} from "@/lib/server/error";
import { gitApiProvider } from "@/lib/server/providers/git-api";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser } from "@/lib/server/session";

const prisma = getPrisma();

// Note: This route isn't rate-limited since to send PRs
// user needs to generate them first, which is already rate-limited
export async function POST(
	_req: NextRequest,
	context: { params: Promise<{ repoId: string; prId: string }> },
) {
	try {
		// 1. Find user
		const user = await getCurrentUser();
		if (!user) throw new ForbiddenError("Unauthenticated");

		// 2. Get and validate IDs from params
		const { repoId } = await uuidParam("repoId").parseAsync(
			await context.params,
		);
		const { prId } = await uuidParam("prId").parseAsync(await context.params);

		// 3. Find PR from DB with repository members
		const prDraft = await prisma.pullRequest.findUnique({
			where: { id: prId },
			include: {
				repository: {
					include: { installation: true, members: true },
				},
			},
		});

		if (!prDraft) throw new NotFoundError("PR not found");
		if (prDraft.repositoryId !== repoId) {
			throw new BadRequestError("PR does not belong to this repository");
		}
		if (prDraft.repository.status === "deleted") {
			throw new NotFoundError("Repository not found");
		}

		// 4. Check permissions
		const membership = prDraft.repository.members.find(
			(m) => m.userId === user.id,
		);

		if (!membership) {
			throw new ForbiddenError("You are not a member of this repository");
		}

		// Member can only send their own PR; owner can send any PR
		if (membership.role !== "owner" && prDraft.createdById !== user.id) {
			throw new ForbiddenError("Not your PR");
		}

		if (prDraft.status !== "draft") {
			throw new BadRequestError("PR already sent");
		}

		// 5. Get installation from PR's repository
		const repo = prDraft.repository;
		if (!repo.installation?.installationId) {
			throw new BadRequestError("Repository has no linked installation");
		}

		// 6. Post PR to GitHub
		let ghPr: { url: string; number: number; state: string };
		try {
			ghPr = await gitApiProvider.createPullRequest(
				repo.installation.installationId,
				repo.owner,
				repo.name,
				{
					title: prDraft.title,
					body: prDraft.description,
					baseBranch: prDraft.baseBranch,
					headBranch: prDraft.compareBranch,
				},
			);
		} catch (err) {
			// If GitHub returns 401/403/404, the installation was likely revoked
			if (err instanceof GitHubApiError && [401, 403, 404].includes(err.status)) {
				await prisma.repository.update({
					where: { id: repo.id },
					data: { status: "disconnected" },
				});

				return NextResponse.json(
					{ error: "Repository access has been revoked", code: "REPO_ACCESS_REVOKED" },
					{ status: 422 },
				);
			}
			throw err;
		}

		// 7. Update PR status in DB
		await prisma.pullRequest.update({
			where: { id: prId },
			data: {
				status: "sent",
				providerPrUrl: ghPr.url,
			},
		});

		// 8. Return GitHub PR url
		return NextResponse.json({
			url: ghPr.url,
		});
	} catch (error) {
		return handleError(error);
	}
}
