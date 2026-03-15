import { describe, expect, it, vi } from "vitest";
import { POST as acceptPOST } from "@/app/api/invitations/accept/route";
import { POST as declinePOST } from "@/app/api/invitations/decline/route";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { seedRepo } from "@/tests/helpers/repo";
import { buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

/** Generate a deterministic 64-char token. */
function makeToken(suffix = "1") {
	return suffix.padStart(64, "0");
}

async function seedInvitation(opts: {
	repositoryId: string;
	email: string;
	invitedById: string;
	token?: string;
	status?: "pending" | "accepted" | "declined";
	expiresAt?: Date;
}) {
	return testPrisma.invitation.create({
		data: {
			repositoryId: opts.repositoryId,
			email: opts.email,
			invitedById: opts.invitedById,
			token: opts.token ?? makeToken(),
			status: opts.status ?? "pending",
			expiresAt: opts.expiresAt ?? new Date(Date.now() + 86_400_000),
		},
	});
}

// ---------------------------------------------------------------------------
// POST /api/invitations/accept
// ---------------------------------------------------------------------------
describe("POST /api/invitations/accept", () => {
	it("accepts an invitation and creates membership", async () => {
		// ARRANGE
		const owner = await seedUser("owner@example.com", "owner");
		const invitee = await seedUser("invitee@example.com", "invitee");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: invitee.id, email: invitee.email }),
		);
		const { repository } = await seedRepo({ userId: owner.id });
		const token = makeToken("accept1");
		await seedInvitation({
			repositoryId: repository.id,
			email: invitee.email,
			invitedById: owner.id,
			token,
		});
		const req = buildRequest("POST", "/api/invitations/accept", { body: { token } });

		// ACT
		const res = await acceptPOST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ success: true });

		const member = await testPrisma.repositoryMember.findFirst({
			where: { repositoryId: repository.id, userId: invitee.id },
		});
		expect(member).not.toBeNull();
		expect(member?.role).toBe("member");

		const inv = await testPrisma.invitation.findFirst({ where: { token } });
		expect(inv?.status).toBe("accepted");
	});

	it("returns 404 when invitation does not exist", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const req = buildRequest("POST", "/api/invitations/accept", {
			body: { token: makeToken("notfound") },
		});

		// ACT
		const res = await acceptPOST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Invitation not found" });
	});

	it("returns 400 when invitation is expired", async () => {
		// ARRANGE
		const owner = await seedUser("owner@example.com", "owner");
		const invitee = await seedUser("invitee@example.com", "invitee");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: invitee.id, email: invitee.email }),
		);
		const { repository } = await seedRepo({ userId: owner.id });
		const token = makeToken("expired1");
		await seedInvitation({
			repositoryId: repository.id,
			email: invitee.email,
			invitedById: owner.id,
			token,
			expiresAt: new Date(Date.now() - 1000),
		});
		const req = buildRequest("POST", "/api/invitations/accept", { body: { token } });

		// ACT
		const res = await acceptPOST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Invitation is no longer valid" });
	});

	it("returns 403 when email does not match", async () => {
		// ARRANGE
		const owner = await seedUser("owner@example.com", "owner");
		const wrongUser = await seedUser("wrong@example.com", "wronguser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: wrongUser.id, email: wrongUser.email }),
		);
		const { repository } = await seedRepo({ userId: owner.id });
		const token = makeToken("wrongemail");
		await seedInvitation({
			repositoryId: repository.id,
			email: "someone-else@example.com",
			invitedById: owner.id,
			token,
		});
		const req = buildRequest("POST", "/api/invitations/accept", { body: { token } });

		// ACT
		const res = await acceptPOST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "This invitation was sent to another email address" });
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/invitations/accept", {
			body: { token: makeToken() },
		});

		// ACT
		const res = await acceptPOST(req);

		// ASSERT
		expect(res.status).toBe(401);
	});
});

// ---------------------------------------------------------------------------
// POST /api/invitations/decline
// ---------------------------------------------------------------------------
describe("POST /api/invitations/decline", () => {
	it("declines an invitation and updates status", async () => {
		// ARRANGE
		const owner = await seedUser("owner@example.com", "owner");
		const invitee = await seedUser("invitee@example.com", "invitee");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: invitee.id, email: invitee.email }),
		);
		const { repository } = await seedRepo({ userId: owner.id });
		const token = makeToken("decline1");
		await seedInvitation({
			repositoryId: repository.id,
			email: invitee.email,
			invitedById: owner.id,
			token,
		});
		const req = buildRequest("POST", "/api/invitations/decline", { body: { token } });

		// ACT
		const res = await declinePOST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ success: true });

		const inv = await testPrisma.invitation.findFirst({ where: { token } });
		expect(inv?.status).toBe("declined");

		const member = await testPrisma.repositoryMember.findFirst({
			where: { repositoryId: repository.id, userId: invitee.id },
		});
		expect(member).toBeNull();
	});

	it("returns 404 when invitation does not exist", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const req = buildRequest("POST", "/api/invitations/decline", {
			body: { token: makeToken("notfound") },
		});

		// ACT
		const res = await declinePOST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Invitation not found" });
	});

	it("returns 400 when invitation is already accepted", async () => {
		// ARRANGE
		const owner = await seedUser("owner@example.com", "owner");
		const invitee = await seedUser("invitee@example.com", "invitee");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: invitee.id, email: invitee.email }),
		);
		const { repository } = await seedRepo({ userId: owner.id });
		const token = makeToken("alreadyacc");
		await seedInvitation({
			repositoryId: repository.id,
			email: invitee.email,
			invitedById: owner.id,
			token,
			status: "accepted",
		});
		const req = buildRequest("POST", "/api/invitations/decline", { body: { token } });

		// ACT
		const res = await declinePOST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Invitation is no longer valid" });
	});

	it("returns 403 when email does not match", async () => {
		// ARRANGE
		const owner = await seedUser("owner@example.com", "owner");
		const wrongUser = await seedUser("wrong@example.com", "wronguser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: wrongUser.id, email: wrongUser.email }),
		);
		const { repository } = await seedRepo({ userId: owner.id });
		const token = makeToken("wrongeml2");
		await seedInvitation({
			repositoryId: repository.id,
			email: "someone-else@example.com",
			invitedById: owner.id,
			token,
		});
		const req = buildRequest("POST", "/api/invitations/decline", { body: { token } });

		// ACT
		const res = await declinePOST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "This invitation was sent to another email address" });
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/invitations/decline", {
			body: { token: makeToken() },
		});

		// ACT
		const res = await declinePOST(req);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
