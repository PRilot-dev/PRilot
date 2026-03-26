import { describe, expect, it, vi } from "vitest";
import { createPostHandler } from "@/app/api/repos/[repoId]/pull-requests/generate/fast/route";
import { checkMonthlyLimit, fetchCachedCompareData } from "@/lib/server/pr-generation";
import { testPrisma } from "@/tests/db";
import { mockAIProvider, passingLimiter } from "@/tests/helpers/deps";
import { seedRepo, validBranchBody } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

const mockGetCurrentUser = vi.fn().mockResolvedValue(null);

const POST = createPostHandler({
	prisma: testPrisma,
	aiProvider: mockAIProvider(),
	aiLimiterPerMinute: passingLimiter(),
	aiLimiterPerMonth: passingLimiter(),
	getCurrentUser: mockGetCurrentUser,
});

describe("POST /api/repos/[repoId]/pull-requests/generate/fast", () => {
	it("returns 200 with generated PR via SSE", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/fast`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson<{ title: string; description: string }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.title).toBeDefined();
		expect(data.description).toBeDefined();
	});

	it("returns 400 when no commits found between branches", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		vi.mocked(fetchCachedCompareData).mockResolvedValueOnce({
			commits: [],
			files: [],
			cacheHit: false,
		});
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/fast`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "No commits found between branches" });
	});

	it("returns 429 when monthly limit is exceeded", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const { NextResponse } = await import("next/server");
		vi.mocked(checkMonthlyLimit).mockResolvedValueOnce(
			NextResponse.json(
				{ error: "Monthly PR generation limit reached." },
				{ status: 429 },
			) as never,
		);
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/fast`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(429);
		expect(data).toMatchObject({ error: "Monthly PR generation limit reached." });
	});

	it("returns 403 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/fast`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
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
		const req = buildRequest("POST", `/api/repos/${fakeId}/pull-requests/generate/fast`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Repository not found" });
	});

	it("returns 422 when branches are missing", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/fast`, {
			body: { baseBranch: "", compareBranch: "" },
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
		const req = buildRequest("POST", `/api/repos/${fakeId}/pull-requests/generate/fast`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await POST(req, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
