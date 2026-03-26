import { NextResponse } from "next/server";
import type { PrismaClient } from "@/db";
import { InvitationStatus, prisma } from "@/db";
import { optionalUuidParam, uuidParam } from "@/lib/schemas/id.schema";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { IEmailProvider } from "@/lib/server/interfaces";
import { emailProvider } from "@/lib/server/providers/email";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";


interface RepoMemberOrInvite {
	id: string;
	username?: string;
	email: string;
	role?: string | null;
	createdAt: Date;
	status?: InvitationStatus; // only for invitations
}

interface Deps {
	prisma: PrismaClient;
	emailProvider: IEmailProvider;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { prisma, emailProvider, getCurrentUser: defaultGetCurrentUser };

// =======================================
// GET all members and pending invitations
// =======================================
export function createGetHandler(deps: Deps = defaultDeps) {
	return async (
		_req: Request,
		context: { params: Promise<{ repoId: string }> },
	) => {
		try {
			// 1. Find logged-in user
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			// 2. Parse and validate repoId
			const { repoId } = await uuidParam("repoId").parseAsync(
				await context.params,
			);

			// 3. Ensure user is a member of the repo
			const isMember = await deps.prisma.repositoryMember.findFirst({
				where: { repositoryId: repoId, userId: user.id },
			});
			if (!isMember)
				throw new ForbiddenError("You do not have access to this repository");

			// 4. Fetch repository members
			const members = await deps.prisma.repositoryMember.findMany({
				where: { repositoryId: repoId },
				include: { user: true },
			});

			// 5. Fetch pending invitations
			const invitations = await deps.prisma.invitation.findMany({
				where: { repositoryId: repoId, status: "pending" },
			});

			// 6. Format members and invitations
			const combined: RepoMemberOrInvite[] = [
				...members.map((m) => ({
					id: m.user.id,
					username: m.user.username,
					email: m.user.email,
					role: m.role,
					createdAt: m.createdAt,
				})),
				...invitations.map((i) => ({
					id: i.id,
					email: i.email,
					role: null,
					createdAt: i.createdAt,
					status: InvitationStatus.pending,
				})),
			];

			return NextResponse.json({ members: combined });
		} catch (error) {
			return handleError(error);
		}
	};
}

// ===================================
// DELETE a member from the repository
// ===================================
export function createDeleteHandler(deps: Deps = defaultDeps) {
	return async (
		req: Request,
		context: { params: Promise<{ repoId: string }> },
	) => {
		try {
			// 1. Get current user and validate params/body
			const currentUser = await deps.getCurrentUser();
			if (!currentUser) throw new UnauthorizedError("Unauthenticated");

			const { repoId } = await uuidParam("repoId").parseAsync(
				await context.params,
			);

			// Avoid to throw an error if body is empty (when a member leaves repo)
			const body = await req.json().catch(() => ({}));
			const { userId: targetUserId } =
				await optionalUuidParam("userId").parseAsync(body);

			// 2. Find member record of target user
			const targetUser = targetUserId || currentUser.id;
			const member = await deps.prisma.repositoryMember.findFirst({
				where: { repositoryId: repoId, userId: targetUser },
				include: { user: true },
			});

			// 2b. If no member found, check for a pending invitation to cancel
			if (!member && targetUserId) {
				const invitation = await deps.prisma.invitation.findFirst({
					where: {
						id: targetUserId,
						repositoryId: repoId,
						status: "pending",
					},
				});
				if (!invitation) throw new NotFoundError("Member not found");

				// Only owners can cancel invitations
				const currentUserMembership =
					await deps.prisma.repositoryMember.findFirst({
						where: { repositoryId: repoId, userId: currentUser.id },
					});
				if (currentUserMembership?.role !== "owner") {
					throw new ForbiddenError("Only owners can cancel invitations");
				}

				await deps.prisma.invitation.delete({ where: { id: invitation.id } });

				return NextResponse.json({ success: true });
			}

			if (!member) throw new NotFoundError("Member not found");

			// 3. Determine if currentUser is owner
			const currentUserMembership = await deps.prisma.repositoryMember.findFirst({
				where: { repositoryId: repoId, userId: currentUser.id },
			});
			const isOwner = currentUserMembership?.role === "owner";

			// 4. Authorization
			if (targetUser !== currentUser.id && !isOwner) {
				throw new ForbiddenError("Only owners can remove other members");
			}

			// 5. Prevent owner from removing themselves
			if (member.userId === currentUser.id && isOwner) {
				throw new BadRequestError("Owners cannot remove themselves");
			}

			// 6. Fetch repository name and owner info for email
			const repo = await deps.prisma.repository.findFirst({
				where: { id: repoId },
				select: {
					status: true,
					name: true,
					installation: {
						select: {
							createdBy: {
								select: { id: true, email: true, username: true },
							},
						},
					},
				},
			});
			if (!repo || repo.status === "deleted")
				throw new NotFoundError("Repository not found");

			// 7. Delete membership
			await deps.prisma.repositoryMember.delete({ where: { id: member.id } });

			// 8. Send email (do not block if sending fails)
			const owner = repo.installation?.createdBy;
			await Promise.allSettled([
				targetUser === currentUser.id && owner
					? deps.emailProvider.sendMemberLeft({
							to: owner.email,
							repoName: repo.name,
							username: member.user.username,
						})
					: null,
				targetUser !== currentUser.id && member.user.email
					? deps.emailProvider.sendMemberRemoved({
							to: member.user.email,
							repoName: repo.name,
							removedBy: currentUser.username,
						})
					: null,
			]);

			return NextResponse.json({ success: true });
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
export const DELETE = createDeleteHandler();
