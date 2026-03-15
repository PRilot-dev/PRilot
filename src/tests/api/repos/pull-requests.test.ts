import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/repos/[repoId]/pull-requests/route";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { seedPullRequest, seedRepo } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

type PrListResponse = {
	pullRequests: { id: string; title: string; status: string }[];
	pagination: { page: number; perPage: number; total: number; totalPages: number };
};

describe("GET /api/repos/[repoId]/pull-requests", () => {
	it("returns 200 with paginated pull requests", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { title: "PR 1" } });
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { title: "PR 2" } });
		const req = buildRequest("GET", `/api/repos/${repository.id}/pull-requests`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<PrListResponse>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.pullRequests).toHaveLength(2);
		expect(data.pagination).toMatchObject({ page: 1, total: 2 });
	});

	it("filters by status=draft", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { status: "draft" } });
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { status: "sent" } });
		const req = buildRequest("GET", `/api/repos/${repository.id}/pull-requests?status=draft`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<PrListResponse>(res);

		// ASSERT
		expect(data.pullRequests).toHaveLength(1);
		expect(data.pullRequests[0].status).toBe("draft");
		expect(data.pagination.total).toBe(1);
	});

	it("paginates correctly", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		for (let i = 0; i < 3; i++) {
			await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { title: `PR ${i}` } });
		}
		const req = buildRequest("GET", `/api/repos/${repository.id}/pull-requests?page=2&per_page=2`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<PrListResponse>(res);

		// ASSERT
		expect(data.pullRequests).toHaveLength(1);
		expect(data.pagination).toMatchObject({ page: 2, perPage: 2, total: 3, totalPages: 2 });
	});

	it("only returns PRs created by the current user", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: other.id, role: "member" },
		});
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { title: "Mine" } });
		await seedPullRequest({ repositoryId: repository.id, createdById: other.id, overrides: { title: "Theirs" } });
		const req = buildRequest("GET", `/api/repos/${repository.id}/pull-requests`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<PrListResponse>(res);

		// ASSERT
		expect(data.pullRequests).toHaveLength(1);
		expect(data.pullRequests[0].title).toBe("Mine");
	});

	it("returns 404 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const req = buildRequest("GET", `/api/repos/${repository.id}/pull-requests`);
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
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("GET", `/api/repos/${fakeId}/pull-requests`);
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await GET(req, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
