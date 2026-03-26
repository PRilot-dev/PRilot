import { describe, expect, it, vi } from "vitest";
import { createGetHandler } from "@/app/api/auth/me/route";
import { parseJson } from "@/tests/helpers/request";
import { mockUser } from "@/tests/helpers/user";
import { createMockGetCurrentUser } from "@/tests/helpers/deps";

const mockGetCurrentUser = createMockGetCurrentUser();

const GET = createGetHandler({ getCurrentUser: mockGetCurrentUser });

describe("GET /api/auth/me", () => {
	it("returns 200 with the current user when authenticated", async () => {
		// ARRANGE
		const user = mockUser();
		mockGetCurrentUser.mockResolvedValueOnce(user);

		// ACT
		const res = await GET();
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data).toMatchObject({
			email: user.email,
			username: user.username,
			hasPassword: true,
			oauthProviders: [],
		});
	});

	it("returns 401 when unauthenticated", async () => {
		// ACT
		const res = await GET();
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "Unauthenticated" });
	});
});
