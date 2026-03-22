import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getPrisma } from "@/db";
import { emailSchema } from "@/lib/schemas/email.schema";
import { uuidParam } from "@/lib/schemas/id.schema";
import { config } from "@/lib/server/config";
import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";
import { inviteEmailLimiter } from "@/lib/server/providers/rate-limiters";
import { emailProvider } from "@/lib/server/providers/email";
import { getCurrentUser } from "@/lib/server/session";

const prisma = getPrisma();

export async function POST(
	req: Request,
	context: { params: Promise<{ repoId: string }> },
) {
	try {
		// 1. Find user and validate repoId params
		const user = await getCurrentUser();
		if (!user) throw new UnauthorizedError("Unauthenticated");

		const { repoId } = await uuidParam("repoId").parseAsync(
			await context.params,
		);

		// 2. Rate limit per user
		const limit = await inviteEmailLimiter.limit(
			`invite:email:user:${user.id}`,
		);
		rateLimitOrThrow(limit);

		// 3. Validate body
		const { email } = await emailSchema.parseAsync(await req.json());

		// 4. Prevent inviting self
		if (email.toLowerCase() === user.email.toLowerCase()) {
			throw new ConflictError(
				"You cannot invite yourself to your own repository",
			);
		}

		// 5. Fetch repo + permission check
		const repo = await prisma.repository.findUnique({
			where: { id: repoId },
			include: {
				members: {
					where: { userId: user.id },
				},
			},
		});
		if (!repo || repo.status === "deleted")
			throw new NotFoundError("Repository not found");

		const isOwner = repo.members.some(
			(m) => m.userId === user.id && m.role === "owner",
		);
		if (!isOwner) throw new ForbiddenError("Forbidden");

		// 6. Check if invited user already exists AND is already a repo member
		const invitedUser = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				memberships: {
					where: { repositoryId: repoId },
					select: { id: true },
				},
			},
		});

		if (invitedUser && invitedUser.memberships.length > 0) {
			throw new ConflictError(
				"This user is already a member of the repository",
			);
		}

		// 7. Enforce max 4 members (members + pending invitations)
		const [membersCount, pendingInvitesCount, existingInvite] =
			await Promise.all([
				prisma.repositoryMember.count({
					where: { repositoryId: repoId },
				}),
				prisma.invitation.count({
					where: { repositoryId: repoId, status: "pending" },
				}),
				prisma.invitation.findUnique({
					where: {
						repositoryId_email: { repositoryId: repoId, email },
					},
					select: { status: true },
				}),
			]);

		const isResend = existingInvite?.status === "pending";
		const total = membersCount + pendingInvitesCount + (isResend ? 0 : 1);

		if (total > 4) {
			throw new ConflictError(
				"A repository can have a maximum of 4 members (including pending invitations)",
			);
		}

		// 8. Create/update invitation
		const token = crypto.randomBytes(32).toString("hex");

		await prisma.invitation.upsert({
			where: {
				repositoryId_email: {
					repositoryId: repo.id,
					email,
				},
			},
			update: {
				token,
				status: "pending",
				invitedById: user.id,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
			create: {
				repositoryId: repo.id,
				email,
				invitedById: user.id,
				token,
				status: "pending",
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});

		// 9. Send email
		const inviteUrl = `${config.frontendUrl}/invitations/${token}/accept`;
		const declineUrl = `${config.frontendUrl}/invitations/${token}/decline`;

		const result = await emailProvider.sendRepoInvite({
			to: email,
			repoName: repo.name,
			owner: user.username,
			inviteUrl,
			declineUrl,
		});

		if (result.error) throw new Error("Error sending email");

		return NextResponse.json({ success: true });
	} catch (error) {
		return handleError(error);
	}
}
