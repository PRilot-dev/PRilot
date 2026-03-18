/** Result returned after attempting to send an email. */
export interface SendEmailResult {
	/** Provider-assigned ID for the sent email, if available. */
	id?: string;
	error?: { message: string };
}

/**
 * Transactional email sending interface.
 * Each method corresponds to a specific email type.
 * Template rendering is an implementation detail.
 * Current implementation: Resend.
 */
export interface IEmailProvider {
	sendVerificationCode(params: {
		to: string;
		code: string;
	}): Promise<SendEmailResult>;

	sendPasswordReset(params: {
		to: string;
		resetUrl: string;
	}): Promise<SendEmailResult>;

	sendRepoInvite(params: {
		to: string;
		repoName: string;
		owner: string;
		inviteUrl: string;
		declineUrl: string;
	}): Promise<SendEmailResult>;

	sendMemberJoined(params: {
		to: string;
		repoName: string;
		username: string;
	}): Promise<SendEmailResult>;

	sendMemberRemoved(params: {
		to: string;
		repoName: string;
		removedBy: string;
	}): Promise<SendEmailResult>;

	sendMemberLeft(params: {
		to: string;
		repoName: string;
		username: string;
	}): Promise<SendEmailResult>;

	sendInvitationDeclined(params: {
		to: string;
		repoName: string;
		declinedBy: string;
	}): Promise<SendEmailResult>;
}
