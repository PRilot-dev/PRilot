import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/auth/github/start/route";
import { buildRequest } from "@/tests/helpers/request";

describe("GET /api/auth/github/start", () => {
	it("redirects to GitHub OAuth with correct params", async () => {
		// ARRANGE
		const req = buildRequest("GET", "/api/auth/github/start");

		// ACT
		const res = await GET(req);

		// ASSERT
		expect(res.status).toBe(307);
		const location = res.headers.get("location")!;
		const url = new URL(location);
		expect(url.origin).toBe("https://github.com");
		expect(url.pathname).toBe("/login/oauth/authorize");
		expect(url.searchParams.get("client_id")).toBe("test-github-client-id");
		expect(url.searchParams.get("scope")).toBe("read:user user:email");
		expect(url.searchParams.get("state")).toBeTruthy();
	});

	it("sets github_oauth_state cookie", async () => {
		// ARRANGE
		const req = buildRequest("GET", "/api/auth/github/start");

		// ACT
		const res = await GET(req);

		// ASSERT
		const setCookies = res.headers.getSetCookie();
		expect(setCookies.some((c: string) => c.startsWith("github_oauth_state="))).toBe(true);
	});

	it("uses the same state in the URL and the cookie", async () => {
		// ARRANGE
		const req = buildRequest("GET", "/api/auth/github/start");

		// ACT
		const res = await GET(req);

		// ASSERT
		const location = new URL(res.headers.get("location")!);
		const urlState = location.searchParams.get("state");

		const setCookies = res.headers.getSetCookie();
		const stateCookie = setCookies.find((c: string) => c.startsWith("github_oauth_state="));
		const cookieState = stateCookie?.split("=")[1]?.split(";")[0];

		expect(urlState).toBe(cookieState);
	});
});
