import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { getPrisma } from "@/db";
import { invitationTokenSchema } from "@/lib/schemas/invitations.schema";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { emailProvider } from "@/lib/server/providers/email";
import { getCurrentUser } from "@/lib/server/session";

const prisma = getPrisma();

export async function POST(req: Request) {
	try {
		// 1. Find user
		const user = await getCurrentUser();
		if (!user) throw new UnauthorizedError("Unauthenticated");

		// 2. Validate and sanitize body
		const { token } = await invitationTokenSchema.parseAsync(await req.json());
		const safeToken = sanitizeHtml(token);

		// 3. Fetch invitation
		const invitation = await prisma.invitation.findUnique({
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

		// 6. Update invitation to declined
		await prisma.invitation.update({
			where: { id: invitation.id },
			data: {
				status: "declined",
				declinedAt: new Date(),
			},
		});

		// 7. Notify the repository owner that the invitation was declined
		const ownerMember = await prisma.repositoryMember.findFirst({
			where: { repositoryId: invitation.repositoryId, role: "owner" },
			include: { user: true },
		});

		if (ownerMember) {
			await emailProvider.sendInvitationDeclined({
				to: ownerMember.user.email,
				repoName: invitation.repository.name,
				declinedBy: user.username,
			});
		}

		// 8. Return success
		return NextResponse.json({ success: true });
	} catch (error) {
		return handleError(error);
	}
}
