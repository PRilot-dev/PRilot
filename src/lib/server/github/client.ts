import { gitAppProvider } from "@/lib/server/providers/git-app";
import { GitHubApiError } from "../error";

interface GitHubFetchOptions {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: object;
	returnLinkHeader?: boolean;
}

// GitHub fetch helper - We use a generic T type parameter to inject expected response types
export async function githubFetch<T = unknown>(
	installationId: string,
	path: string,
	options?: GitHubFetchOptions,
): Promise<{ data: T; linkHeader?: string | null }> {
	const { token } = await gitAppProvider.createInstallationAccessToken(installationId);
	const res = await fetch(`https://api.github.com${path}`, {
		method: options?.method ?? "GET",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			...(options?.body && { "Content-Type": "application/json" }),
		},
		body:
			options?.method === "GET"
				? undefined
				: options?.body
					? JSON.stringify(options.body)
					: undefined,
	});

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new GitHubApiError(res.status, body?.message ?? "GitHub API error");
	}

	const data = await res.json();

	return {
		data: data as T,
		linkHeader: options?.returnLinkHeader ? res.headers.get("link") : null,
	};
}
