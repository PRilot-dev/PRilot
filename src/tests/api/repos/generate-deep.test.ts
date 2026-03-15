import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/repos/[repoId]/pull-requests/generate/deep/route";
import { fetchCachedCompareData } from "@/lib/server/pr-generation";
import { getCurrentUser } from "@/lib/server/session";
import { seedRepo, validBranchBody } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

const mockFile = { filename: "src/index.ts", status: "modified", changes: 10, patch: "diff" };

describe("POST /api/repos/[repoId]/pull-requests/generate/deep", () => {
	it("returns 200 with generated PR via SSE", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		vi.mocked(fetchCachedCompareData).mockResolvedValueOnce({
			commits: ["feat: first commit"],
			files: [mockFile] as never,
			cacheHit: false,
		});
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/deep`, {
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

	it("returns 400 when no file changes found", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		vi.mocked(fetchCachedCompareData).mockResolvedValueOnce({
			commits: [],
			files: [],
			cacheHit: false,
		});
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/deep`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "No file changes found between branches" });
	});

	it("returns 400 when too many lines changed", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		vi.mocked(fetchCachedCompareData).mockResolvedValueOnce({
			commits: ["feat: big change"],
			files: [{ filename: "big.ts", status: "modified", changes: 501, patch: "diff" }] as never,
			cacheHit: false,
		});
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/deep`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({
			error: "Too many lines changed (max 500 for deep mode). Please use fast mode instead.",
		});
	});

	it("returns 403 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/deep`, {
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
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("POST", `/api/repos/${fakeId}/pull-requests/generate/deep`, {
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
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/deep`, {
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
		const req = buildRequest("POST", `/api/repos/${fakeId}/pull-requests/generate/deep`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await POST(req, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
