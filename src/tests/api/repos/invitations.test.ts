import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/repos/[repoId]/invitations/route";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { seedRepo } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

describe("POST /api/repos/[repoId]/invitations", () => {
	it("creates an invitation and returns 200", async () => {
		// ARRANGE
		const owner = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id, email: owner.email }));
		const { repository } = await seedRepo({ userId: owner.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/invitations`, {
			body: { email: "invited@example.com" },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ success: true });
		const invitation = await testPrisma.invitation.findFirst({
			where: { repositoryId: repository.id, email: "invited@example.com" },
		});
		expect(invitation).not.toBeNull();
		expect(invitation?.status).toBe("pending");
	});

	it("resends invitation if one already exists for the same email", async () => {
		// ARRANGE
		const owner = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id, email: owner.email }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.invitation.create({
			data: {
				repositoryId: repository.id,
				email: "invited@example.com",
				invitedById: owner.id,
				token: "old-token",
				status: "pending",
				expiresAt: new Date(Date.now() + 86_400_000),
			},
		});
		const req = buildRequest("POST", `/api/repos/${repository.id}/invitations`, {
			body: { email: "invited@example.com" },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);

		// ASSERT
		expect(res.status).toBe(200);
		const invitations = await testPrisma.invitation.findMany({
			where: { repositoryId: repository.id, email: "invited@example.com" },
		});
		expect(invitations).toHaveLength(1);
		expect(invitations[0].token).not.toBe("old-token");
	});

	it("returns 409 when inviting self", async () => {
		// ARRANGE
		const owner = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id, email: owner.email }));
		const { repository } = await seedRepo({ userId: owner.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/invitations`, {
			body: { email: owner.email },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(409);
		expect(data).toMatchObject({ error: "You cannot invite yourself to your own repository" });
	});

	it("returns 409 when user is already a member", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id, email: owner.email }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const req = buildRequest("POST", `/api/repos/${repository.id}/invitations`, {
			body: { email: member.email },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(409);
		expect(data).toMatchObject({ error: "This user is already a member of the repository" });
	});

	it("returns 409 when max members (4) would be exceeded", async () => {
		// ARRANGE
		const owner = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id, email: owner.email }));
		const { repository } = await seedRepo({ userId: owner.id });
		// Add 3 more members (total 4 with owner)
		for (let i = 0; i < 3; i++) {
			const m = await seedUser(`m${i}@example.com`, `member${i}`);
			await testPrisma.repositoryMember.create({
				data: { repositoryId: repository.id, userId: m.id, role: "member" },
			});
		}
		const req = buildRequest("POST", `/api/repos/${repository.id}/invitations`, {
			body: { email: "toomany@example.com" },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(409);
		expect(data).toMatchObject({
			error: "A repository can have a maximum of 4 members (including pending invitations)",
		});
	});

	it("returns 403 when user is not the owner", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: member.id, email: member.email }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const req = buildRequest("POST", `/api/repos/${repository.id}/invitations`, {
			body: { email: "invited@example.com" },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "Forbidden" });
	});

	it("returns 404 when repo does not exist", async () => {
		// ARRANGE
		const owner = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id, email: owner.email }));
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("POST", `/api/repos/${fakeId}/invitations`, {
			body: { email: "invited@example.com" },
		});
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Repository not found" });
	});

	it("returns 422 when email is invalid", async () => {
		// ARRANGE
		const owner = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id, email: owner.email }));
		const { repository } = await seedRepo({ userId: owner.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/invitations`, {
			body: { email: "not-an-email" },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);

		// ASSERT
		expect(res.status).toBe(422);
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("POST", `/api/repos/${fakeId}/invitations`, {
			body: { email: "invited@example.com" },
		});
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await POST(req, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
