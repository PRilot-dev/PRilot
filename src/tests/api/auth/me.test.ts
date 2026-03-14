import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/auth/me/route";
import { getCurrentUser } from "@/lib/server/session";
import { parseJson } from "@/tests/helpers/request";
import { mockUser } from "@/tests/helpers/user";

describe("GET /api/auth/me", () => {
	it("returns 200 with the current user when authenticated", async () => {
		// ARRANGE
		const user = mockUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(user);

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
