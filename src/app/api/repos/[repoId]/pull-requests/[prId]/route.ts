import { type NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { getPrisma } from "@/db";
import { uuidParam } from "@/lib/schemas/id.schema";
import { updatePrSchema } from "@/lib/schemas/pr.schema";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser } from "@/lib/server/session";

const prisma = getPrisma();

// ----------------------
// ------ Get a PR ------
// ----------------------
export async function GET(
	_req: NextRequest,
	context: { params: Promise<{ repoId: string; prId: string }> },
) {
	try {
		// 1. Find current user
		const user = await getCurrentUser();
		if (!user) throw new ForbiddenError("Unauthenticated");

		// 2. Get and validate IDs from params
		const { repoId } = await uuidParam("repoId").parseAsync(
			await context.params,
		);
		const { prId } = await uuidParam("prId").parseAsync(await context.params);

		// 3. Find PR in DB including current user's membership
		const pr = await prisma.pullRequest.findUnique({
			where: { id: prId },
			include: {
				repository: {
					include: {
						members: {
							where: { userId: user.id },
						},
					},
				},
			},
		});

		// 4. Validate PR existence and repository match
		if (!pr) throw new NotFoundError("PR not found");
		if (pr.repositoryId !== repoId) {
			throw new BadRequestError("PR does not belong to this repository");
		}

		// 5. Check membership
		const membership = pr.repository.members[0];
		if (!membership) {
			throw new ForbiddenError("You are not a member of this repository");
		}

		// 6. Permission check: owner can view all, member only own PR
		if (membership.role !== "owner" && pr.createdById !== user.id) {
			throw new ForbiddenError("Not your PR");
		}

		// 7. Return PR (strip nested repository/member data)
		const { repository: _repo, ...prData } = pr;
		return NextResponse.json(prData);
	} catch (error) {
		return handleError(error);
	}
}

// -----------------------
// ------ Edit a PR ------
// -----------------------
export async function PATCH(
	req: NextRequest,
	context: { params: Promise<{ repoId: string; prId: string }> },
) {
	try {
		// 1. Find current user
		const user = await getCurrentUser();
		if (!user) throw new ForbiddenError("Unauthenticated");

		// 2. Get and validate IDs from params
		const { repoId } = await uuidParam("repoId").parseAsync(
			await context.params,
		);
		const { prId } = await uuidParam("prId").parseAsync(await context.params);

		// 3. Validate and sanitize inputs
		const { prTitle, prBody, baseBranch, compareBranch, language, mode } =
			await updatePrSchema.parseAsync(await req.json());

		const safePrTitle = sanitizeHtml(prTitle);
		const safePrBody = sanitizeHtml(prBody);

		// 4. Find PR in DB including current user's membership
		const pr = await prisma.pullRequest.findUnique({
			where: { id: prId },
			include: {
				repository: {
					include: {
						members: {
							where: { userId: user.id },
						},
					},
				},
			},
		});

		// 5. Validate PR existence and repository match
		if (!pr) throw new NotFoundError("PR not found");
		if (pr.repositoryId !== repoId) {
			throw new BadRequestError("PR does not belong to this repository");
		}

		// 6. Check membership
		const membership = pr.repository.members[0];
		if (!membership) {
			throw new ForbiddenError("You are not a member of this repository");
		}

		// 7. Permission check: owner can edit all, member only own PR
		if (membership.role !== "owner" && pr.createdById !== user.id) {
			throw new ForbiddenError("Not your PR");
		}

		// 8. Status check
		if (pr.status !== "draft") {
			throw new BadRequestError("Cannot edit sent PR");
		}

		// 9. Update PR
		await prisma.pullRequest.update({
			where: { id: prId },
			data: {
				title: safePrTitle,
				description: safePrBody,
				baseBranch: baseBranch,
				compareBranch: compareBranch,
				language: language,
				mode: mode
			},
		});

		// 10. Return success
		return NextResponse.json({ success: true });
	} catch (error) {
		return handleError(error);
	}
}

// ------------------------
// ------ Delete a PR ------
// ------------------------
export async function DELETE(
	_req: NextRequest,
	context: { params: Promise<{ repoId: string; prId: string }> },
) {
	try {
		// 1. Find current user
		const user = await getCurrentUser();
		if (!user) throw new ForbiddenError("Unauthenticated");

		// 2. Get and validate IDs from params
		const { repoId } = await uuidParam("repoId").parseAsync(
			await context.params,
		);
		const { prId } = await uuidParam("prId").parseAsync(await context.params);

		// 3. Find PR in DB including current user's membership
		const pr = await prisma.pullRequest.findUnique({
			where: { id: prId },
			include: {
				repository: {
					include: {
						members: {
							where: { userId: user.id },
						},
					},
				},
			},
		});

		// 4. Validate PR existence and repository match
		if (!pr) throw new NotFoundError("PR not found");
		if (pr.repositoryId !== repoId) {
			throw new BadRequestError("PR does not belong to this repository");
		}

		// 5. Check membership
		const membership = pr.repository.members[0];
		if (!membership) {
			throw new ForbiddenError("You are not a member of this repository");
		}

		// 6. Permission check: owner can delete all, member only own PR
		if (membership.role !== "owner" && pr.createdById !== user.id) {
			throw new ForbiddenError("Not your PR");
		}

		// 7. Status check: only draft PRs can be deleted
		if (pr.status !== "draft") {
			throw new BadRequestError("Cannot delete sent PR");
		}

		// 8. Delete PR
		await prisma.pullRequest.delete({
			where: { id: prId },
		});

		// 9. Return success
		return NextResponse.json({ success: true });
	} catch (error) {
		return handleError(error);
	}
}
