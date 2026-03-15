import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/repos/[repoId]/pull-requests/[prId]/send/route";
import { GitHubApiError } from "@/lib/server/error";
import { githubFetch } from "@/lib/server/github/client";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { seedPullRequest, seedRepo } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

function prParams(repoId: string, prId: string) {
	return buildParams({ repoId, prId });
}

describe("POST /api/repos/[repoId]/pull-requests/[prId]/send", () => {
	it("sends a draft PR to GitHub and returns the URL", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: user.id });
		vi.mocked(githubFetch).mockResolvedValueOnce({
			data: { html_url: "https://github.com/test-org/test-repo/pull/1", state: "open" },
		} as never);
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/${pr.id}/send`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await POST(req as never, ctx);
		const data = await parseJson<{ url: string }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.url).toBe("https://github.com/test-org/test-repo/pull/1");

		const updated = await testPrisma.pullRequest.findUnique({ where: { id: pr.id } });
		expect(updated?.status).toBe("sent");
		expect(updated?.providerPrUrl).toBe("https://github.com/test-org/test-repo/pull/1");
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
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/${pr.id}/send`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await POST(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "PR already sent" });
	});

	it("marks repo as disconnected when GitHub returns 403", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: user.id });
		vi.mocked(githubFetch).mockRejectedValueOnce(
			new GitHubApiError(403, "Forbidden"),
		);
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/${pr.id}/send`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await POST(req as never, ctx);
		const data = await parseJson<{ error: string; code: string }>(res);

		// ASSERT
		expect(res.status).toBe(422);
		expect(data).toMatchObject({
			error: "Repository access has been revoked",
			code: "REPO_ACCESS_REVOKED",
		});

		const repo = await testPrisma.repository.findUnique({ where: { id: repository.id } });
		expect(repo?.status).toBe("disconnected");
	});

	it("returns 403 when member tries to send another member's PR", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: member.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: owner.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/${pr.id}/send`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await POST(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "Not your PR" });
	});

	it("returns 403 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const pr = await seedPullRequest({ repositoryId: repository.id, createdById: other.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/${pr.id}/send`);
		const ctx = prParams(repository.id, pr.id);

		// ACT
		const res = await POST(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "You are not a member of this repository" });
	});

	it("returns 404 when PR does not exist", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/${fakeId}/send`);
		const ctx = prParams(repository.id, fakeId);

		// ACT
		const res = await POST(req as never, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "PR not found" });
	});

	it("returns 403 when unauthenticated", async () => {
		// ARRANGE
		const fakeRepoId = "00000000-0000-0000-0000-000000000000";
		const fakePrId = "00000000-0000-0000-0000-000000000001";
		const req = buildRequest("POST", `/api/repos/${fakeRepoId}/pull-requests/${fakePrId}/send`);
		const ctx = prParams(fakeRepoId, fakePrId);

		// ACT
		const res = await POST(req as never, ctx);

		// ASSERT
		expect(res.status).toBe(403);
	});
});
