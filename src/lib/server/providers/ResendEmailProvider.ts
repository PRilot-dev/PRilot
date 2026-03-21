import type { Resend } from "resend";
import { escapeHtml } from "@/lib/server/escapeHtml";
import type { IEmailProvider, SendEmailResult } from "@/lib/server/interfaces";

interface EmailConfig {
	appName: string;
	domainName: string;
	logoUrl: string;
}

export class ResendEmailProvider implements IEmailProvider {
	constructor(
		private readonly resend: Resend,
		private readonly config: EmailConfig,
	) {}

	async sendVerificationCode(params: {
		to: string;
		code: string;
	}): Promise<SendEmailResult> {
		const body = `
			<p style="font-size:16px; color:#111827;">Enter this code to sign in</p>

			<table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
				<tr>
					<td style="padding:16px 32px; background-color:#f3f4f6; border-radius:8px;
							font-size:32px; font-weight:700; letter-spacing:8px; color:#111827; text-align:center;">
						${params.code}
					</td>
				</tr>
			</table>

			<p style="font-size:14px; color:#374151;">
				Enter the code above on your device to sign in to ${this.config.appName}. This code will expire in 10 minutes.
			</p>

			<p style="font-size:14px; color:#6b7280;">
				If you didn&rsquo;t make this request, you can safely ignore this email.
			</p>

			<p style="font-size:13px; color:#6b7280;">
				For security reasons, never share this code with anyone.
			</p>

			<hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />

			<p style="font-size:13px; color:#9ca3af;">
				The ${this.config.appName} Team
			</p>
		`;

		return this.send({
			to: params.to,
			subject: `${this.config.appName} : Your sign-in code`,
			title: "Sign-In Code",
			heading: "Your Sign-In Code",
			body,
		});
	}

	async sendPasswordReset(params: {
		to: string;
		resetUrl: string;
	}): Promise<SendEmailResult> {
		const body = `
			<p>Hello,</p>

			<p>
				We received a request to reset your password on <strong>${this.config.appName}</strong>.
			</p>

			<p style="margin-top:16px;">Click the button below to set a new password:</p>

			<table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
				<tr>
					<td>
						<a href="${params.resetUrl}"
							style="display:inline-block; padding:12px 24px; background-color:#4f46e5;
								color:#ffffff; text-decoration:none; font-weight:700; border-radius:6px;">
							Reset Password
						</a>
					</td>
				</tr>
			</table>

			<p style="font-size:14px; color:#6b7280;">
				This link will expire in 10 minutes.
			</p>

			<hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />

			<p style="font-size:12px; color:#9ca3af; text-align:center;">
				If you did not request a password reset, you can safely ignore this email.
			</p>
		`;

		return this.send({
			to: params.to,
			subject: "Reset your password",
			title: "Password Reset",
			heading: "Reset Your Password",
			body,
		});
	}

	async sendRepoInvite(params: {
		to: string;
		repoName: string;
		owner: string;
		inviteUrl: string;
		declineUrl: string;
	}): Promise<SendEmailResult> {
		const safeOwner = escapeHtml(params.owner);
		const safeRepoName = escapeHtml(params.repoName);

		const body = `
			<p>Hello,</p>

			<p>
				<strong>${safeOwner}</strong> has invited you to join the repository
				<strong>${safeRepoName}</strong> on <strong>${this.config.appName}</strong>.
			</p>

			<p style="margin-top:16px;">Please choose an option below:</p>

			<table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
				<tr>
					<td style="padding-right:8px;">
						<a href="${params.inviteUrl}"
							style="display:inline-block; padding:12px 24px; background-color:#4f46e5;
								color:#ffffff; text-decoration:none; font-weight:700; border-radius:6px;">
							Accept Invitation
						</a>
					</td>
					<td>
						<a href="${params.declineUrl}"
							style="display:inline-block; padding:12px 24px; background-color:#e5e7eb;
								color:#374151; text-decoration:none; font-weight:700; border-radius:6px;">
							Decline Invitation
						</a>
					</td>
				</tr>
			</table>

			<p style="font-size:14px; color:#6b7280;">
				This invitation will expire in 7 days.
			</p>

			<hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />

			<p style="font-size:12px; color:#9ca3af; text-align:center;">
				If you did not expect this invitation, you can safely ignore this email.
			</p>
		`;

		return this.send({
			to: params.to,
			subject: `You've been invited by ${safeOwner} to join ${safeRepoName}`,
			title: "Repository Invitation",
			heading: "You're Invited!",
			body,
		});
	}

	async sendMemberJoined(params: {
		to: string;
		repoName: string;
		username: string;
	}): Promise<SendEmailResult> {
		const safeUsername = escapeHtml(params.username);
		const safeRepoName = escapeHtml(params.repoName);

		return this.send({
			to: params.to,
			subject: `${safeUsername} joined ${safeRepoName}`,
			title: "New member joined",
			heading: "A new member joined your repository",
			body: `
				<p>
					<strong>${safeUsername}</strong> has accepted the invitation and joined
					the repository <strong>${safeRepoName}</strong>.
				</p>
			`,
		});
	}

	async sendMemberRemoved(params: {
		to: string;
		repoName: string;
		removedBy: string;
	}): Promise<SendEmailResult> {
		const safeRepoName = escapeHtml(params.repoName);
		const safeRemovedBy = escapeHtml(params.removedBy);

		return this.send({
			to: params.to,
			subject: `Removed from ${safeRepoName}`,
			title: "Access removed",
			heading: "You've been removed from a repository",
			body: `
				<p>
					You have been removed from the repository
					<strong>${safeRepoName}</strong> by <strong>${safeRemovedBy}</strong>.
				</p>

				<p style="margin-top:16px;">
					If you believe this was a mistake, you can contact the repository
					owner for clarification.
				</p>
			`,
		});
	}

	async sendMemberLeft(params: {
		to: string;
		repoName: string;
		username: string;
	}): Promise<SendEmailResult> {
		const safeUsername = escapeHtml(params.username);
		const safeRepoName = escapeHtml(params.repoName);

		return this.send({
			to: params.to,
			subject: `${safeUsername} left ${safeRepoName}`,
			title: "Member left repository",
			heading: "A member left your repository",
			body: `
				<p>
					<strong>${safeUsername}</strong> has left the repository
					<strong>${safeRepoName}</strong>.
				</p>
			`,
		});
	}

	async sendInvitationDeclined(params: {
		to: string;
		repoName: string;
		declinedBy: string;
	}): Promise<SendEmailResult> {
		const safeDeclinedBy = escapeHtml(params.declinedBy);
		const safeRepoName = escapeHtml(params.repoName);

		return this.send({
			to: params.to,
			subject: `${safeDeclinedBy} declined your invitation to ${safeRepoName}`,
			title: "Invitation declined",
			heading: "Invitation declined",
			body: `
				<p>
					<strong>${safeDeclinedBy}</strong> has declined your invitation to join
					the repository <strong>${safeRepoName}</strong>.
				</p>

				<p style="margin-top:16px;">
					You can resend an invitation at any time or reach out to them
					directly if needed.
				</p>
			`,
		});
	}

	// ==================================
	// ======== Internal helpers ========
	// ==================================

	private async send(params: {
		to: string;
		subject: string;
		title: string;
		heading: string;
		body: string;
	}): Promise<SendEmailResult> {
		const html = this.buildTemplate(params.title, params.heading, params.body);

		const result = await this.resend.emails.send({
			from: `${this.config.appName} <noreply@${this.config.domainName}>`,
			to: params.to,
			subject: params.subject,
			html,
		});

		return {
			id: result.data?.id,
			error: result.error ? { message: result.error.message } : undefined,
		};
	}

	private buildTemplate(title: string, heading: string, body: string): string {
		const safeTitle = escapeHtml(title);
		const safeHeading = escapeHtml(heading);
		const year = new Date().getFullYear();

		return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<title>${safeTitle}</title>
</head>
<body style="margin:0; padding:32px; background-color:#dbe1ed; font-family:Arial,sans-serif;">
	<table width="100%" cellpadding="0" cellspacing="0" border="0">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" border="0"
					style="background-color: white; overflow:hidden; border-radius: 16px;
						border-left: 1px solid #aca9be; border-right: 1px solid #aca9be;
				">
					<!-- Header -->
					<tr>
						<td align="left" style="padding:32px 32px 16px 32px;">
							<img src="${this.config.logoUrl}" alt="${this.config.appName}" style="height:48px; margin-bottom:24px;" />
							<h1 style="margin:0; font-size:32px; font-weight:700; color:#111827;">
								${safeHeading}
							</h1>
						</td>
					</tr>

					<!-- Body -->
					<tr>
						<td style="padding:0 32px 24px; font-size:16px; line-height:1.6; color:#111827;">
							${body}
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="border-top: 1px solid #dae1ed; text-align:center; font-size:12px; color:#9ca3af; padding:16px;">
							&copy; ${year} ${this.config.appName}. All rights reserved.
						</td>
					</tr>

				</table>
			</td>
		</tr>
	</table>
</body>
</html>
`;
	}
}
