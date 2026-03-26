import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { invitationTokenSchema } from "@/lib/schemas/invitations.schema";
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

interface Deps {
	prisma: PrismaClient;
	emailProvider: IEmailProvider;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { prisma, emailProvider, getCurrentUser: defaultGetCurrentUser };

export function createPostHandler(deps: Deps = defaultDeps) {
	return async (req: Request) => {
		try {
			// 1. Find user
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			// 2. Validate and sanitize body
			const { token } = await invitationTokenSchema.parseAsync(await req.json());
			const safeToken = sanitizeHtml(token);

			// 3. Fetch invitation
			const invitation = await deps.prisma.invitation.findUnique({
				where: { token: safeToken },
				include: { repository: true, invitedBy: true },
			});
			if (!invitation) throw new NotFoundError("Invitation not found");

			// 4. Validate status & expiration
			if (invitation.status !== "pending" || invitation.expiresAt < new Date()) {
				throw new BadRequestError("Invitation is no longer valid");
			}

			// 5. Check email matches logged-in user
			if (user.email !== invitation.email) {
				throw new ForbiddenError(
					"This invitation was sent to another email address",
				);
			}

			// 6. Create membership and update invitation atomically
			await deps.prisma.$transaction([
				deps.prisma.repositoryMember.create({
					data: {
						repositoryId: invitation.repositoryId,
						userId: user.id,
						role: "member",
					},
				}),
				deps.prisma.invitation.update({
					where: { id: invitation.id },
					data: {
						status: "accepted",
						acceptedAt: new Date(),
					},
				}),
			]);

			// 7. Notify repo owner
			const ownerMember = await deps.prisma.repositoryMember.findFirst({
				where: {
					repositoryId: invitation.repositoryId,
					role: "owner",
				},
				include: { user: true },
			});

			if (ownerMember) {
				await deps.emailProvider.sendMemberJoined({
					to: ownerMember.user.email,
					repoName: invitation.repository.name,
					username: user.username,
				});
			}

			// 8. Return success
			return NextResponse.json({ success: true });
		} catch (error) {
			return handleError(error);
		}
	};
}

export const POST = createPostHandler();
