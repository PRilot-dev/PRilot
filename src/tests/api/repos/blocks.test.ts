import { describe, expect, it } from "vitest";
import { createGetHandler, createPutHandler } from "@/app/api/repos/[repoId]/blocks/route";
import { testPrisma } from "@/tests/db";
import { createMockGetCurrentUser } from "@/tests/helpers/deps";
import { seedRepo } from "@/tests/helpers/repo";
import { buildParams, buildRequest, parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

const mockGetCurrentUser = createMockGetCurrentUser();

const deps = {
	prisma: testPrisma,
	getCurrentUser: mockGetCurrentUser,
};

const GET = createGetHandler(deps);
const PUT = createPutHandler(deps);

async function seedBlocks() {
	const summary = await testPrisma.block.create({
		data: {
			slug: "summary",
			name: "Summary",
			description: "A high-level overview",
			promptConcise: "concise",
			promptStandard: "standard",
			promptDetailed: "detailed",
		},
	});
	const changes = await testPrisma.block.create({
		data: {
			slug: "changes",
			name: "Changes",
			description: "A breakdown of key changes",
			promptConcise: "concise",
			promptStandard: "standard",
			promptDetailed: "detailed",
		},
	});
	return { summary, changes };
}

// ======================================
// GET /api/repos/[repoId]/blocks
// ======================================
describe("GET /api/repos/[repoId]/blocks", () => {
	it("returns empty array when no blocks configured", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const req = buildRequest("GET", `/api/repos/${repository.id}/blocks`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<{ repositoryBlocks: unknown[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.repositoryBlocks).toHaveLength(0);
	});

	it("returns configured blocks for a repo", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const { summary, changes } = await seedBlocks();

		await testPrisma.repositoryBlock.createMany({
			data: [
				{ repositoryId: repository.id, blockId: summary.id, branchType: "default", position: 0, detailLevel: 1 },
				{ repositoryId: repository.id, blockId: changes.id, branchType: "default", position: 1, detailLevel: 3 },
			],
		});

		const req = buildRequest("GET", `/api/repos/${repository.id}/blocks`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<{
			repositoryBlocks: { blockId: string; branchType: string; position: number; detailLevel: number; block: { slug: string } }[];
		}>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.repositoryBlocks).toHaveLength(2);
		expect(data.repositoryBlocks[0]).toMatchObject({
			branchType: "default",
			position: 0,
			detailLevel: 1,
			block: { slug: "summary" },
		});
		expect(data.repositoryBlocks[1]).toMatchObject({
			branchType: "default",
			position: 1,
			detailLevel: 3,
			block: { slug: "changes" },
		});
	});

	it("returns blocks across multiple branch types", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const { summary, changes } = await seedBlocks();

		await testPrisma.repositoryBlock.createMany({
			data: [
				{ repositoryId: repository.id, blockId: summary.id, branchType: "default", position: 0, detailLevel: 2 },
				{ repositoryId: repository.id, blockId: changes.id, branchType: "feat", position: 0, detailLevel: 3 },
			],
		});

		const req = buildRequest("GET", `/api/repos/${repository.id}/blocks`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);
		const data = await parseJson<{
			repositoryBlocks: { branchType: string; block: { slug: string } }[];
		}>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.repositoryBlocks).toHaveLength(2);
		const branchTypes = data.repositoryBlocks.map((rb) => rb.branchType);
		expect(branchTypes).toContain("default");
		expect(branchTypes).toContain("feat");
	});

	it("returns 403 when user is not a member", async () => {
		// ARRANGE
		const owner = await seedUser();
		const stranger = await seedUser("stranger@example.com", "stranger");
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: stranger.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		const req = buildRequest("GET", `/api/repos/${repository.id}/blocks`);
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await GET(req, ctx);

		// ASSERT
		expect(res.status).toBe(403);
	});

	it("returns 404 when repo does not exist", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("GET", `/api/repos/${fakeId}/blocks`);
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await GET(req, ctx);

		// ASSERT
		expect(res.status).toBe(404);
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("GET", `/api/repos/${fakeId}/blocks`);
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await GET(req, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});

// ===========================================
// PUT /api/repos/[repoId]/blocks
// ===========================================
describe("PUT /api/repos/[repoId]/blocks", () => {
	it("saves block config for a branch type", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const { summary, changes } = await seedBlocks();

		const req = buildRequest("PUT", `/api/repos/${repository.id}/blocks`, {
			body: {
				branchType: "default",
				blocks: [
					{ blockId: summary.id, position: 0, detailLevel: 1 },
					{ blockId: changes.id, position: 1, detailLevel: 3 },
				],
			},
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await PUT(req, ctx);
		const data = await parseJson<{
			repositoryBlocks: { block: { slug: string }; detailLevel: number }[];
		}>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.repositoryBlocks).toHaveLength(2);
		expect(data.repositoryBlocks[0]).toMatchObject({
			detailLevel: 1,
			block: { slug: "summary" },
		});

		// Verify in DB
		const dbBlocks = await testPrisma.repositoryBlock.findMany({
			where: { repositoryId: repository.id, branchType: "default" },
			orderBy: { position: "asc" },
		});
		expect(dbBlocks).toHaveLength(2);
	});

	it("replaces existing config on save", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const { summary, changes } = await seedBlocks();

		// Create initial config
		await testPrisma.repositoryBlock.create({
			data: { repositoryId: repository.id, blockId: summary.id, branchType: "default", position: 0, detailLevel: 2 },
		});

		// Save new config with only changes block
		const req = buildRequest("PUT", `/api/repos/${repository.id}/blocks`, {
			body: {
				branchType: "default",
				blocks: [{ blockId: changes.id, position: 0, detailLevel: 3 }],
			},
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await PUT(req, ctx);
		const data = await parseJson<{
			repositoryBlocks: { block: { slug: string } }[];
		}>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.repositoryBlocks).toHaveLength(1);
		expect(data.repositoryBlocks[0].block.slug).toBe("changes");

		// Old block should be gone
		const dbBlocks = await testPrisma.repositoryBlock.findMany({
			where: { repositoryId: repository.id, branchType: "default" },
		});
		expect(dbBlocks).toHaveLength(1);
	});

	it("clears config when empty blocks array is sent", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const { summary } = await seedBlocks();

		await testPrisma.repositoryBlock.create({
			data: { repositoryId: repository.id, blockId: summary.id, branchType: "feat", position: 0, detailLevel: 2 },
		});

		const req = buildRequest("PUT", `/api/repos/${repository.id}/blocks`, {
			body: { branchType: "feat", blocks: [] },
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await PUT(req, ctx);
		const data = await parseJson<{ repositoryBlocks: unknown[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.repositoryBlocks).toHaveLength(0);
	});

	it("does not affect other branch types", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		const { summary, changes } = await seedBlocks();

		// Seed default config
		await testPrisma.repositoryBlock.create({
			data: { repositoryId: repository.id, blockId: summary.id, branchType: "default", position: 0, detailLevel: 2 },
		});

		// Save feat config
		const req = buildRequest("PUT", `/api/repos/${repository.id}/blocks`, {
			body: {
				branchType: "feat",
				blocks: [{ blockId: changes.id, position: 0, detailLevel: 3 }],
			},
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await PUT(req, ctx);

		// ASSERT
		expect(res.status).toBe(200);

		// Default config should be untouched
		const defaultBlocks = await testPrisma.repositoryBlock.findMany({
			where: { repositoryId: repository.id, branchType: "default" },
		});
		expect(defaultBlocks).toHaveLength(1);
	});

	it("returns 403 when user is a member but not owner", async () => {
		// ARRANGE
		const owner = await seedUser();
		const member = await seedUser("member@example.com", "member");
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: member.id }));
		const { repository } = await seedRepo({ userId: owner.id });
		await testPrisma.repositoryMember.create({
			data: { repositoryId: repository.id, userId: member.id, role: "member" },
		});
		const { summary } = await seedBlocks();

		const req = buildRequest("PUT", `/api/repos/${repository.id}/blocks`, {
			body: {
				branchType: "default",
				blocks: [{ blockId: summary.id, position: 0, detailLevel: 2 }],
			},
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await PUT(req, ctx);
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(403);
		expect(data).toMatchObject({
			error: "Only the repository owner can configure PR templates",
		});
	});

	it("returns 422 when body is invalid", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });

		const req = buildRequest("PUT", `/api/repos/${repository.id}/blocks`, {
			body: {
				branchType: "default",
				blocks: [{ blockId: "not-a-uuid", position: -1 }],
			},
		});
		const ctx = buildParams({ repoId: repository.id });

		// ACT
		const res = await PUT(req, ctx);

		// ASSERT
		expect(res.status).toBe(422);
	});

	it("returns 401 when unauthenticated", async () => {
		// ARRANGE
		const fakeId = "00000000-0000-0000-0000-000000000000";
		const req = buildRequest("PUT", `/api/repos/${fakeId}/blocks`, {
			body: { branchType: "default", blocks: [] },
		});
		const ctx = buildParams({ repoId: fakeId });

		// ACT
		const res = await PUT(req, ctx);

		// ASSERT
		expect(res.status).toBe(401);
	});
});
