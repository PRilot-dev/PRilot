import { type NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { getPrisma } from "@/db";
import { branchSchema } from "@/lib/schemas/branch.schema";
import { uuidParam } from "@/lib/schemas/id.schema";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from "@/lib/server/error";
import { getCompareData } from "@/lib/server/github/compare";
import { handleError } from "@/lib/server/handleError";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { githubCompareCommitsLimiter } from "@/lib/server/redis/rate-limiters";
import { getCurrentUser } from "@/lib/server/session";

const prisma = getPrisma();

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ repoId: string }> },
) {
	try {
		// 1. Find user
		const user = await getCurrentUser();
		if (!user) throw new ForbiddenError("Unauthenticated");

		// 2. Get and validate repo id
		const { repoId } = await uuidParam("repoId").parseAsync(
			await context.params,
		);

		// 3. Rate limit per user
		const limit = await githubCompareCommitsLimiter.limit(
			`github:compare:user:${user.id}`,
		);
		rateLimitOrThrow(limit);

		// 4. Get branch names from searchParams and validate
		const { searchParams } = new URL(req.url);
		const baseBranch = await branchSchema.parseAsync(searchParams.get("base"));
		const compareBranch = await branchSchema.parseAsync(
			searchParams.get("compare"),
		);

		// 5. Sanitize branch names
		const safeBaseBranch = sanitizeHtml(baseBranch);
		const safeCompareBranch = sanitizeHtml(compareBranch);

		if (!safeBaseBranch || !safeCompareBranch) {
			throw new BadRequestError("Missing base or compare branch");
		}

		// 6. Get repository + installation + members
		const repo = await prisma.repository.findUnique({
			where: { id: repoId },
			include: { installation: true, members: true },
		});

		if (!repo || repo.status === "deleted")
			throw new NotFoundError("Repository not found");
		if (!repo.installation?.installationId) {
			throw new BadRequestError("Repository has no linked installation");
		}

		// 7. Check membership
		const isMember = repo.members.some((m) => m.userId === user.id);
		if (!isMember) {
			throw new ForbiddenError("You are not a member of this repository");
		}

		// 8. Fetch commits from GitHub
		const { commits } = await getCompareData(
			repo.installation.installationId,
			repo.owner,
			repo.name,
			safeBaseBranch,
			safeCompareBranch,
		);

		return NextResponse.json({ commits });
	} catch (error) {
		return handleError(error);
	}
}
