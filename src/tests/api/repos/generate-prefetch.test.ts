import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/repos/[repoId]/pull-requests/generate/prefetch/route";
import { gitApiProvider } from "@/lib/server/providers/git-api";
import { getCurrentUser } from "@/lib/server/session";
import { seedRepo, validBranchBody } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

describe("POST /api/repos/[repoId]/pull-requests/generate/prefetch", () => {
	it("returns 200 and caches compare data", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		vi.mocked(gitApiProvider.compareBranches).mockResolvedValueOnce({
			commits: ["feat: something"],
			files: [{ filename: "index.ts", status: "modified", additions: 3, deletions: 2, changes: 5, patch: "diff" }],
		});
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/prefetch`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({ ok: true });
	});

	it("returns 403 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/prefetch`, {
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
		const req = buildRequest("POST", `/api/repos/${fakeId}/pull-requests/generate/prefetch`, {
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
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/generate/prefetch`, {
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
		const req = buildRequest("POST", `/api/repos/${fakeId}/pull-requests/generate/prefetch`, {
			body: validBranchBody(),
		});
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await POST(req, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
