import { vi } from "vitest";

// Resend client — needed by the ResendEmailProvider adapter
vi.mock("@/lib/server/resend/client", () => ({
	resend: { emails: { send: vi.fn().mockResolvedValue({ id: "mock-email-id" }) } },
}));

// Email provider — all routes import from here
vi.mock("@/lib/server/providers/email", () => ({
	emailProvider: {
		sendVerificationCode: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendPasswordReset: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendRepoInvite: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendMemberJoined: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendMemberRemoved: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendMemberLeft: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
		sendInvitationDeclined: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
	},
}));
