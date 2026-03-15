import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/pull-requests/recent/route";
import { getCurrentUser } from "@/lib/server/session";
import { seedPullRequest, seedRepo } from "@/tests/helpers/repo";
import { buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

describe("GET /api/pull-requests/recent", () => {
	it("returns 200 with recent PRs and weekly stats", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id });
		const req = buildRequest("GET", "/api/pull-requests/recent");

		// ACT
		const res = await GET(req as never);
		const data = await parseJson<{
			recentPRs: { id: string; repoName: string }[];
			stats: { thisWeek: number; lastWeek: number };
		}>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.recentPRs).toHaveLength(1);
		expect(data.recentPRs[0].repoName).toBe("test-repo");
		expect(data.stats).toBeDefined();
	});

	it("returns at most 3 recent PRs", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		for (let i = 0; i < 5; i++) {
			await seedPullRequest({ repositoryId: repository.id, createdById: user.id });
		}
		const req = buildRequest("GET", "/api/pull-requests/recent");

		// ACT
		const res = await GET(req as never);
		const data = await parseJson<{ recentPRs: unknown[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.recentPRs).toHaveLength(3);
	});

	it("excludes PRs from deleted repositories", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({
			userId: user.id,
			repoOverrides: { status: "deleted", name: "deleted-repo" },
		});
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id });
		const req = buildRequest("GET", "/api/pull-requests/recent");

		// ACT
		const res = await GET(req as never);
		const data = await parseJson<{ recentPRs: unknown[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.recentPRs).toHaveLength(0);
	});

	it("excludes PRs from repos user is no longer a member of", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		// PR created by user but user is not a member
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id });
		const req = buildRequest("GET", "/api/pull-requests/recent");

		// ACT
		const res = await GET(req as never);
		const data = await parseJson<{ recentPRs: unknown[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.recentPRs).toHaveLength(0);
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const req = buildRequest("GET", "/api/pull-requests/recent");

		// ACT
		const res = await GET(req as never);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
