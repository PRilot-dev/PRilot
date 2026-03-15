import { describe, expect, it, vi } from "vitest";
import { DELETE, GET } from "@/app/api/repos/[repoId]/route";
import { githubFetch } from "@/lib/server/github/client";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { seedPullRequest, seedRepo } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

// ---------------------------------------------------------------------------
// GET /api/repos/[repoId]
// ---------------------------------------------------------------------------
describe("GET /api/repos/[repoId]", () => {
	function mockGithubBranchesAndCommits() {
		vi.mocked(githubFetch)
			// branches
			.mockResolvedValueOnce({
				data: [{ name: "main" }, { name: "dev" }],
				linkHeader: null,
			} as never)
			// commits count
			.mockResolvedValueOnce({
				data: [],
				linkHeader: '<url?&page=42>; rel="last"',
			} as never);
	}

	it("returns 200 with repo details, branches, and commit count", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		mockGithubBranchesAndCommits();
		const req = buildRequest("GET", `/api/repos/${repository.id}`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<{
			repository: { id: string; userRole: string; membersCount: number };
			branches: string[];
			commitsCount: number;
			isAccessible: boolean;
		}>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.repository).toMatchObject({
			id: repository.id,
			name: "test-repo",
			userRole: "owner",
			membersCount: 1,
		});
		expect(data.branches).toEqual(["main", "dev"]);
		expect(data.commitsCount).toBe(42);
		expect(data.isAccessible).toBe(true);
	});

	it("returns isAccessible false for disconnected repos", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({
			userId: user.id,
			repoOverrides: { status: "disconnected" },
		});
		const req = buildRequest("GET", `/api/repos/${repository.id}`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<{ isAccessible: boolean; branches: string[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.isAccessible).toBe(false);
		expect(data.branches).toEqual([]);
	});

	it("includes PR counts scoped to the current user", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: other.id, role: "member" },
		});
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { status: "draft" } });
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { status: "sent" } });
		// Other user's PR should not be counted
		await seedPullRequest({ repositoryId: repository.id, createdById: other.id, overrides: { status: "draft" } });
		mockGithubBranchesAndCommits();
		const req = buildRequest("GET", `/api/repos/${repository.id}`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<{
			repository: { draftPrCount: number; sentPrCount: number };
		}>(res);

		// ASSERT
		expect(data.repository.draftPrCount).toBe(1);
		expect(data.repository.sentPrCount).toBe(1);
	});

	it("returns 404 when repo does not exist", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("GET", `/api/repos/${fakeId}`);
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Repository not found" });
	});

	it("returns 404 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const req = buildRequest("GET", `/api/repos/${repository.id}`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Repository not found or unauthorized" });
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const req = buildRequest("GET", "/api/repos/some-id");
		const ctx = buildParams({ repoId: "00000000-0000-0000-0000-000000000000" });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "Unauthenticated" });
	});
});

// ---------------------------------------------------------------------------
// DELETE /api/repos/[repoId]
// ---------------------------------------------------------------------------
describe("DELETE /api/repos/[repoId]", () => {
	it("soft-deletes the repo and removes members and invitations", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		await testPrisma.invitation.create({
			data: {
				repositoryId: repository.id,
				email: "invited@example.com",
				invitedById: user.id,
				token: "invite-token",
				status: "pending",
				expiresAt: new Date(Date.now() + 86_400_000),
			},
		});
		const req = buildRequest("DELETE", `/api/repos/${repository.id}`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await DELETE(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ success: true });

		const repo = await testPrisma.repository.findUnique({ where: { id: repository.id } });
		expect(repo?.status).toBe("deleted");

		const members = await testPrisma.repositoryMember.count({ where: { repositoryId: repository.id } });
		expect(members).toBe(0);

		const invitations = await testPrisma.invitation.count({ where: { repositoryId: repository.id, status: "pending" } });
		expect(invitations).toBe(0);
	});

	it("returns 403 when user is a member but not the owner", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: member.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const req = buildRequest("DELETE", `/api/repos/${repository.id}`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await DELETE(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "Only the owner can delete a repository" });
	});

	it("returns 404 when repo does not exist", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("DELETE", `/api/repos/${fakeId}`);
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await DELETE(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Repository not found" });
	});

	it("returns 404 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const req = buildRequest("DELETE", `/api/repos/${repository.id}`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await DELETE(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Repository not found or unauthorized" });
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const req = buildRequest("DELETE", "/api/repos/some-id");
		const ctx = buildParams({ repoId: "00000000-0000-0000-0000-000000000000" });

		// ACT
		const res = await DELETE(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "Unauthenticated" });
	});
});
