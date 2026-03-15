import { describe, expect, it, vi } from "vitest";
import { DELETE, GET } from "@/app/api/repos/[repoId]/members/route";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { seedRepo } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

// ---------------------------------------------------------------------------
// GET /api/repos/[repoId]/members
// ---------------------------------------------------------------------------
describe("GET /api/repos/[repoId]/members", () => {
	it("returns members and pending invitations", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		await testPrisma.invitation.create({
			data: {
				repositoryId: repository.id,
				email: "invited@example.com",
				invitedById: owner.id,
				token: "inv-token",
				status: "pending",
				expiresAt: new Date(Date.now() + 86_400_000),
			},
		});
		const req = buildRequest("GET", `/api/repos/${repository.id}/members`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<{
			members: { email: string; role: string | null; status?: string }[];
		}>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.members).toHaveLength(3);

		const emails = data.members.map((m) => m.email);
		expect(emails).toContain(owner.email);
		expect(emails).toContain(member.email);
		expect(emails).toContain("invited@example.com");

		const pending = data.members.find((m) => m.email === "invited@example.com");
		expect(pending?.status).toBe("pending");
		expect(pending?.role).toBeNull();
	});

	it("returns 403 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const req = buildRequest("GET", `/api/repos/${repository.id}/members`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "You do not have access to this repository" });
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("GET", `/api/repos/${fakeId}/members`);
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await GET(req, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});

// ---------------------------------------------------------------------------
// DELETE /api/repos/[repoId]/members
// ---------------------------------------------------------------------------
describe("DELETE /api/repos/[repoId]/members", () => {
	it("owner can remove another member", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/members`, {
			body: { userId: member.id },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await DELETE(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ success: true });
		const remaining = await testPrisma.repositoryMember.count({
			where: { repositoryId: repository.id, userId: member.id },
		});
		expect(remaining).toBe(0);
	});

	it("member can leave the repo (remove themselves)", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: member.id, username: "member" }),
		);
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/members`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await DELETE(req, ctx);

		// ASSERT
		expect(res.status).toBe(200);
		const remaining = await testPrisma.repositoryMember.count({
			where: { repositoryId: repository.id, userId: member.id },
		});
		expect(remaining).toBe(0);
	});

	it("owner cannot remove themselves", async () => {
		// ARRANGE
		const owner = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/members`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await DELETE(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Owners cannot remove themselves" });
	});

	it("non-owner cannot remove another member", async () => {
		// ARRANGE
		const owner = await seedUser();
		const memberA = await seedUser("a@example.com", "memberA");
		const memberB = await seedUser("b@example.com", "memberB");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: memberA.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.createMany({
			data: [
				{ repositoryId: repository.id, userId: memberA.id, role: "member" },
				{ repositoryId: repository.id, userId: memberB.id, role: "member" },
			],
		});
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/members`, {
			body: { userId: memberB.id },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await DELETE(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "Only owners can remove other members" });
	});

	it("owner can cancel a pending invitation", async () => {
		// ARRANGE
		const owner = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		const invitation = await testPrisma.invitation.create({
			data: {
				repositoryId: repository.id,
				email: "invited@example.com",
				invitedById: owner.id,
				token: "inv-token",
				status: "pending",
				expiresAt: new Date(Date.now() + 86_400_000),
			},
		});
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/members`, {
			body: { userId: invitation.id },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await DELETE(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ success: true });
		const remaining = await testPrisma.invitation.count({ where: { id: invitation.id } });
		expect(remaining).toBe(0);
	});

	it("returns 404 when target member does not exist", async () => {
		// ARRANGE
		const owner = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/members`, {
			body: { userId: fakeId },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await DELETE(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Member not found" });
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("DELETE", `/api/repos/${fakeId}/members`);
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await DELETE(req, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
