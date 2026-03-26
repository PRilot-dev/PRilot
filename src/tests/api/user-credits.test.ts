import { describe, expect, it, vi } from "vitest";
import { createGetHandler } from "@/app/api/user/credits/route";
import { passingLimiter } from "@/tests/helpers/deps";
import { parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

const mockGetCurrentUser = vi.fn().mockResolvedValue(null);
const aiLimiterPerMonth = passingLimiter();

const GET = createGetHandler({
	aiLimiterPerMonth,
	getCurrentUser: mockGetCurrentUser,
});

describe("GET /api/user/credits", () => {
	it("returns 200 with remaining credits and total", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));

		// ACT
		const res = await GET();
		const data = await parseJson<{ remaining: number; total: number; reset: number }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.total).toBe(30);
		expect(data.remaining).toBeDefined();
		expect(data.reset).toBeDefined();
	});

	it("reflects custom remaining value", async () => {
		// ARRANGE
		const user = await seedUser();
		mockGetCurrentUser.mockResolvedValueOnce(mockUser({ id: user.id }));
		vi.mocked(aiLimiterPerMonth.getRemaining).mockResolvedValueOnce({
			remaining: 5,
			reset: Date.now() + 60_000,
		});

		// ACT
		const res = await GET();
		const data = await parseJson<{ remaining: number; total: number }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.remaining).toBe(5);
		expect(data.total).toBe(30);
	});

	it("returns 401 when unauthenticated", async () => {
		// ACT
		const res = await GET();

		// ASSERT
		expect(res.status).toBe(401);
	});
});
