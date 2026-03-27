import { describe, expect, it, vi } from "vitest";
import { createGetHandler } from "@/app/api/repos/[repoId]/compare-commits/github/route";
import { testPrisma } from "@/tests/db";
import { createMockGetCurrentUser, mockGitApiProvider, passingLimiter } from "@/tests/helpers/deps";
import { seedRepo } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

const mockGetCurrentUser = createMockGetCurrentUser();
const gitApiProvider = mockGitApiProvider();

const GET = createGetHandler({
	prisma: testPrisma,
	gitApiProvider,
	githubCompareCommitsLimiter: passingLimiter(),
	getCurrentUser: mockGetCurrentUser,
});

describe("GET /api/repos/[repoId]/compare-commits/github", () => {
	function buildCompareRequest(repoId: string, base = "main", compare = "feature") {
		return buildRequest(
			"GET",
			`/api/repos/${repoId}/compare-commits/github?base=${base}&compare=${compare}`,
		);
	}

	it("returns 200 with commits from GitHub", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const mockCommits = ["feat: something"];
		vi.mocked(gitApiProvider.compareBranches).mockResolvedValueOnce({ commits: mockCommits, files: [] });
		const req = buildCompareRequest(repository.id);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<{ commits: string[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.commits).toEqual(mockCommits);
	});

	it("returns 403 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const req = buildCompareRequest(repository.id);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({ error: "You are not a member of this repository" });
	});

	it("returns 404 when repo does not exist", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildCompareRequest(fakeId);
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Repository not found" });
	});

	it("returns 422 when branch params are missing", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const req = buildRequest("GET", `/api/repos/${repository.id}/compare-commits/github`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);

		// ASSERT
		expect(res.status).toBe(422);
	});

	it("returns 403 when unauthenticated", async () => {
		// ARRANGE
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildCompareRequest(fakeId);
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await GET(req, ctx);

		// ASSERT
		expect(res.status).toBe(403);
	});
});
