import { describe, expect, it } from "vitest";
import { createGetHandler } from "@/app/api/blocks/route";
import { testPrisma } from "@/tests/db";
import { createMockGetCurrentUser } from "@/tests/helpers/deps";
import { parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

const mockGetCurrentUser = createMockGetCurrentUser();

const GET = createGetHandler({
	prisma: testPrisma,
	getCurrentUser: mockGetCurrentUser,
});

async function seedBlocks() {
	await testPrisma.block.createMany({
		data: [
			{
				slug: "summary",
				name: "Summary",
				description: "A high-level overview",
				promptConcise: "concise",
				promptStandard: "standard",
				promptDetailed: "detailed",
			},
			{
				slug: "changes",
				name: "Changes",
				description: "A breakdown of key changes",
				promptConcise: "concise",
				promptStandard: "standard",
				promptDetailed: "detailed",
			},
		],
	});
}

describe("GET /api/blocks", () => {
	it("returns all block definitions", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		await seedBlocks();

		// ACT
		const res = await GET();
		const data = await parseJson<{ blocks: { slug: string; name: string }[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.blocks).toHaveLength(2);
		expect(data.blocks[0]).toMatchObject({ slug: "summary", name: "Summary" });
		expect(data.blocks[1]).toMatchObject({ slug: "changes", name: "Changes" });
	});

	it("returns blocks without prompt fields", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		await seedBlocks();

		// ACT
		const res = await GET();
		const data = await parseJson<{ blocks: Record<string, unknown>[] }>(res);

		// ASSERT
		expect(data.blocks[0]).not.toHaveProperty("promptConcise");
		expect(data.blocks[0]).not.toHaveProperty("promptStandard");
		expect(data.blocks[0]).not.toHaveProperty("promptDetailed");
	});

	it("returns 401 when unauthenticated", async () => {
		// ACT
		const res = await GET();

		// ASSERT
		expect(res.status).toBe(401);
	});
});
