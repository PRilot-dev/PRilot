import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/installations/github/route";
import { GET } from "@/app/api/installations/route";
import { verifyInstallation } from "@/lib/server/github/app";
import { githubFetch } from "@/lib/server/github/client";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

// ---------------------------------------------------------------------------
// GET /api/installations
// ---------------------------------------------------------------------------
describe("GET /api/installations", () => {
	it("returns 200 with user's installations", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		await testPrisma.providerInstallation.create({
			data: {
				provider: "github",
				installationId: "inst-123",
				accountLogin: "my-org",
				accountType: "organization",
				createdById: user.id,
			},
		});

		// ACT
		const res = await GET();
		const data = await parseJson<{ installations: { accountLogin: string }[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.installations).toHaveLength(1);
		expect(data.installations[0].accountLogin).toBe("my-org");
	});

	it("returns empty array when user has no installations", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));

		// ACT
		const res = await GET();
		const data = await parseJson<{ installations: unknown[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.installations).toHaveLength(0);
	});

	it("excludes installations created by other users", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		await testPrisma.providerInstallation.create({
			data: {
				provider: "github",
				installationId: "inst-other",
				accountLogin: "other-org",
				accountType: "user",
				createdById: other.id,
			},
		});

		// ACT
		const res = await GET();
		const data = await parseJson<{ installations: unknown[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.installations).toHaveLength(0);
	});

	it("returns 401 when unauthenticated", async () => {
		// ACT
		const res = await GET();

		// ASSERT
		expect(res.status).toBe(401);
	});
});

// ---------------------------------------------------------------------------
// POST /api/installations/github
// ---------------------------------------------------------------------------
describe("POST /api/installations/github", () => {
	it("creates installation and syncs repos", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		vi.mocked(verifyInstallation).mockResolvedValueOnce({
			id: 12345,
			account: { login: "my-org", type: "User" },
		} as never);
		vi.mocked(githubFetch).mockResolvedValueOnce({
			data: {
				repositories: [
					{
						id: 999,
						name: "cool-repo",
						private: false,
						default_branch: "main",
						owner: { login: "my-org" },
					},
				],
			},
		} as never);
		const req = buildRequest("POST", "/api/installations/github", {
			body: { installationId: "inst-new" },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson<{ success: boolean; repos: { name: string }[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.repos).toHaveLength(1);
		expect(data.repos[0].name).toBe("cool-repo");

		const repo = await testPrisma.repository.findFirst({ where: { name: "cool-repo" } });
		expect(repo).not.toBeNull();
		expect(repo?.owner).toBe("my-org");
	});

	it("returns 409 when installation belongs to another user", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		await testPrisma.providerInstallation.create({
			data: {
				provider: "github",
				installationId: "inst-taken",
				accountLogin: "other-org",
				accountType: "user",
				createdById: other.id,
			},
		});
		vi.mocked(verifyInstallation).mockResolvedValueOnce({
			id: 12345,
			account: { login: "other-org", type: "User" },
		} as never);
		const req = buildRequest("POST", "/api/installations/github", {
			body: { installationId: "inst-taken" },
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(409);
		expect(data).toMatchObject({
			error: "This GitHub installation is already linked to another account",
		});
	});

	it("returns 400 when installationId is missing", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const req = buildRequest("POST", "/api/installations/github", {
			body: {},
		});

		// ACT
		const res = await POST(req);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(400);
		expect(data).toMatchObject({ error: "Installation ID is required" });
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const req = buildRequest("POST", "/api/installations/github", {
			body: { installationId: "inst-123" },
		});

		// ACT
		const res = await POST(req);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
