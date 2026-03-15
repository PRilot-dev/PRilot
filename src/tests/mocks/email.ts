import { vi } from "vitest";

// Resend email — no real emails sent in tests.
// Each email module is mocked at its actual import path so deep imports
// (e.g. @/lib/server/resend/emails/passwordReset) are properly intercepted.

vi.mock("@/lib/server/resend/client", () => ({
	resend: { emails: { send: vi.fn().mockResolvedValue({ id: "mock-email-id" }) } },
}));

vi.mock("@/lib/server/resend/emails/passwordReset", () => ({
	sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/server/resend/emails/verificationCode", () => ({
	sendVerificationCodeEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/server/resend/emails/repoInvite", () => ({
	sendRepoInviteEmail: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/server/resend/emails/memberLeft", () => ({
	sendMemberLeftEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/server/resend/emails/memberRemoved", () => ({
	sendMemberRemovedEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/server/resend/emails/InvitationDeclined", () => ({
	sendInvitationDeclinedEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/server/resend/emails/invitationAccepted", () => ({
	sendMemberJoinedEmail: vi.fn().mockResolvedValue(undefined),
}));
