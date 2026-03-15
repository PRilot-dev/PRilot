import { describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH } from "@/app/api/repos/[repoId]/pull-requests/[prId]/route";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { seedPullRequest, seedRepo, validDraftBody } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

function prParams(repoId: string, prId: string) {
	return buildParams({ repoId, prId });
}

// ---------------------------------------------------------------------------
// GET /api/repos/[repoId]/pull-requests/[prId]
// ---------------------------------------------------------------------------
describe("GET /api/repos/[repoId]/pull-requests/[prId]", () => {
	it("returns 200 with the PR data", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: user.id });
		const req = buildRequest("GET", `/api/repos/${repository.id}/pull-requests/${pr.id}`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await GET(req as never, ctx);
		const data = await parseJson<{ id: string; title: string }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.id).toBe(pr.id);
		expect(data.title).toBe("Test PR");
	});

	it("allows owner to view another member's PR", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: member.id });
		const req = buildRequest("GET", `/api/repos/${repository.id}/pull-requests/${pr.id}`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await GET(req as never, ctx);

		// ASSERT
		expect(res.status).toBe(200);
	});

	it("returns 403 when member tries to view another member's PR", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: member.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: owner.id });
		const req = buildRequest("GET", `/api/repos/${repository.id}/pull-requests/${pr.id}`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await GET(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "Not your PR" });
	});

	it("returns 404 when PR does not exist", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("GET", `/api/repos/${repository.id}/pull-requests/${fakeId}`);
		const ctx = prParams(repository.id, fakeId);

		// ACT
		const res = await GET(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "PR not found" });
	});

	it("returns 400 when PR belongs to a different repo", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository: repo1 } = await seedRepo({ userId: user.id, repoOverrides: { name: "repo-1" } });
		const { repository: repo2 } = await seedRepo({ userId: user.id, repoOverrides: { name: "repo-2" } });
		const pr = await seedPullRequest({ repositoryId: repo2.id, createdById: user.id });
		const req = buildRequest("GET", `/api/repos/${repo1.id}/pull-requests/${pr.id}`);
		const ctx = prParams(repo1.id, pr.id);

		// ACT
		const res = await GET(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "PR does not belong to this repository" });
	});

	it("returns 403 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: other.id });
		const req = buildRequest("GET", `/api/repos/${repository.id}/pull-requests/${pr.id}`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await GET(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "You are not a member of this repository" });
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const fakeRepoId = "00000000-0000-0000-0000-000000000000";
		const fakePrId = "00000000-0000-0000-0000-000000000001";
		const req = buildRequest("GET", `/api/repos/${fakeRepoId}/pull-requests/${fakePrId}`);
		const ctx = prParams(fakeRepoId, fakePrId);

		// ACT
		const res = await GET(req as never, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});

// ---------------------------------------------------------------------------
// PATCH /api/repos/[repoId]/pull-requests/[prId]
// ---------------------------------------------------------------------------
describe("PATCH /api/repos/[repoId]/pull-requests/[prId]", () => {
	it("updates a draft PR and returns 200", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: user.id });
		const body = validDraftBody({ prTitle: "Updated title", prBody: "Updated body content." });
		const req = buildRequest("PATCH", `/api/repos/${repository.id}/pull-requests/${pr.id}`, { body });
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await PATCH(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ success: true });

		const updated = await testPrisma.pullRequest.findUnique({ where: { id: pr.id } });
		expect(updated?.title).toBe("Updated title");
		expect(updated?.description).toBe("Updated body content.");
	});

	it("returns 400 when PR is already sent", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const pr = await seedPullRequest({
			repositoryId: repository.id,
			createdById: user.id,
			overrides: { status: "sent" },
		});
		const body = validDraftBody();
		const req = buildRequest("PATCH", `/api/repos/${repository.id}/pull-requests/${pr.id}`, { body });
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await PATCH(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Cannot edit sent PR" });
	});

	it("returns 403 when member tries to edit another member's PR", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: member.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: owner.id });
		const body = validDraftBody();
		const req = buildRequest("PATCH", `/api/repos/${repository.id}/pull-requests/${pr.id}`, { body });
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await PATCH(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "Not your PR" });
	});

	it("returns 404 when PR does not exist", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const body = validDraftBody();
		const req = buildRequest("PATCH", `/api/repos/${repository.id}/pull-requests/${fakeId}`, { body });
		const ctx = prParams(repository.id, fakeId);

		// ACT
		const res = await PATCH(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "PR not found" });
	});

	it("returns 422 when body is invalid", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: user.id });
		const req = buildRequest("PATCH", `/api/repos/${repository.id}/pull-requests/${pr.id}`, {
			body: { prTitle: "ab", prBody: "" },
		});
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await PATCH(req as never, ctx);

		// ASSERT
		expect(res.status).toBe(422);
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const fakeRepoId = "00000000-0000-0000-0000-000000000000";
		const fakePrId = "00000000-0000-0000-0000-000000000001";
		const body = validDraftBody();
		const req = buildRequest("PATCH", `/api/repos/${fakeRepoId}/pull-requests/${fakePrId}`, { body });
		const ctx = prParams(fakeRepoId, fakePrId);

		// ACT
		const res = await PATCH(req as never, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});

// ---------------------------------------------------------------------------
// DELETE /api/repos/[repoId]/pull-requests/[prId]
// ---------------------------------------------------------------------------
describe("DELETE /api/repos/[repoId]/pull-requests/[prId]", () => {
	it("deletes a draft PR and returns 200", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: user.id });
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/pull-requests/${pr.id}`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await DELETE(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ success: true });

		const deleted = await testPrisma.pullRequest.findUnique({ where: { id: pr.id } });
		expect(deleted).toBeNull();
	});

	it("returns 400 when PR is already sent", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const pr = await seedPullRequest({
			repositoryId: repository.id,
			createdById: user.id,
			overrides: { status: "sent" },
		});
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/pull-requests/${pr.id}`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await DELETE(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Cannot delete sent PR" });
	});

	it("returns 403 when member tries to delete another member's PR", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: member.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: owner.id });
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/pull-requests/${pr.id}`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await DELETE(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "Not your PR" });
	});

	it("returns 404 when PR does not exist", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/pull-requests/${fakeId}`);
		const ctx = prParams(repository.id, fakeId);

		// ACT
		const res = await DELETE(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "PR not found" });
	});

	it("allows owner to delete another member's draft PR", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: owner.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: member.id });
		const req = buildRequest("DELETE", `/api/repos/${repository.id}/pull-requests/${pr.id}`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await DELETE(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ success: true });
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const fakeRepoId = "00000000-0000-0000-0000-000000000000";
		const fakePrId = "00000000-0000-0000-0000-000000000001";
		const req = buildRequest("DELETE", `/api/repos/${fakeRepoId}/pull-requests/${fakePrId}`);
		const ctx = prParams(fakeRepoId, fakePrId);

		// ACT
		const res = await DELETE(req as never, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
