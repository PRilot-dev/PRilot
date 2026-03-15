import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/repos/[repoId]/pull-requests/draft/route";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { seedRepo, validDraftBody } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

describe("POST /api/repos/[repoId]/pull-requests/draft", () => {
	it("creates a draft PR and returns 201", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const body = validDraftBody();
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/draft`, { body });
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson<{ id: string; title: string; status: string; baseBranch: string; compareBranch: string; mode: string }>(res);

		// ASSERT
		expect(res.status).toBe(201);
		expect(data).toMatchObject({
			title: "Add login feature",
			status: "draft",
			baseBranch: "main",
			compareBranch: "feature/login",
			mode: "fast",
		});
		expect(data.id).toBeDefined();

		const pr = await testPrisma.pullRequest.findUnique({ where: { id: data.id } });
		expect(pr).not.toBeNull();
		expect(pr?.createdById).toBe(user.id);
	});

	it("respects language and mode overrides", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const body = validDraftBody({ language: "French", mode: "deep" });
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/draft`, { body });
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson<{ mode: string }>(res);

		// ASSERT
		expect(res.status).toBe(201);
		expect(data.mode).toBe("deep");

		const pr = await testPrisma.pullRequest.findFirst({ where: { repositoryId: repository.id } });
		expect(pr?.language).toBe("French");
		expect(pr?.mode).toBe("deep");
	});

	it("sanitizes HTML in title and body", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const body = validDraftBody({
			prTitle: "Fix <script>alert('xss')</script> bug",
			prBody: "Details <img src=x onerror=alert(1)> here",
		});
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/draft`, { body });
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson<{ id: string; title: string }>(res);

		// ASSERT
		expect(res.status).toBe(201);
		expect(data.title).not.toContain("<script>");

		const pr = await testPrisma.pullRequest.findUnique({ where: { id: data.id } });
		expect(pr?.description).not.toContain("onerror");
	});

	it("returns 403 when user is not a member", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: other.id });
		const body = validDraftBody();
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/draft`, { body });
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
		const body = validDraftBody();
		const req = buildRequest("POST", `/api/repos/${fakeId}/pull-requests/draft`, { body });
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await POST(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(404);
		expect(data).toMatchObject({ error: "Repository not found" });
	});

	it("returns 422 when body is invalid", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const req = buildRequest("POST", `/api/repos/${repository.id}/pull-requests/draft`, {
			body: { prTitle: "ab", prBody: "", baseBranch: "", compareBranch: "" },
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
		const body = validDraftBody();
		const req = buildRequest("POST", `/api/repos/${fakeId}/pull-requests/draft`, { body });
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await POST(req, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
