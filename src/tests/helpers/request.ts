/**
 * Helpers for building Next.js-compatible Request objects in tests.
 *
 * Usage:
 *   const req = buildRequest("POST", "/api/auth/signup", { email: "...", ... })
 *   const res = await POST(req)
 *   const data = await parseJson(res)
 */

type RequestOptions = {
	body?: unknown;
	headers?: Record<string, string>;
	/** Simulated client IP (used by getClientIp). Defaults to "127.0.0.1". */
	ip?: string;
};

/**
 * Build a `Request` that matches what Next.js route handlers receive.
 */
export function buildRequest(
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
	path: string,
	options: RequestOptions = {},
): Request {
	const { body, headers = {}, ip = "127.0.0.1" } = options;

	const url = `http://localhost:3000${path}`;

	const init: RequestInit = {
		method,
		headers: {
			"content-type": "application/json",
			"x-forwarded-for": ip,
			...headers,
		},
	};

	if (body !== undefined) {
		init.body = JSON.stringify(body);
	}

	return new Request(url, init);
}

/**
 * Parse the JSON body of a Response.
 */
export async function parseJson<T = Record<string, unknown>>(
	res: Response,
): Promise<T> {
	return res.json() as Promise<T>;
}

/**
 * Build a route `context` object with dynamic params (as Promises, matching
 * Next.js App Router conventions).
 *
 * Usage:
 *   const ctx = buildParams({ repoId: "some-uuid" })
 *   const res = await GET(req, ctx)
 */
export function buildParams<T extends Record<string, string>>(
	params: T,
): { params: Promise<T> } {
	return { params: Promise.resolve(params) };
}
