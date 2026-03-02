/**
 * Deduplicates concurrent refresh calls so only one runs at a time.
 * All concurrent callers share the same refresh promise.
 */
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
	if (refreshPromise) return refreshPromise;

	refreshPromise = fetch("/api/auth/refresh", {
		method: "POST",
		credentials: "include",
	})
		.then((res) => res.ok)
		.catch(() => false)
		.finally(() => {
			refreshPromise = null;
		});

	return refreshPromise;
}

/**
 * Wrapper around fetch that automatically handles token refresh on 401 errors
 */
export async function fetchWithAuth(
	url: string,
	options?: RequestInit,
): Promise<Response> {
	// Make initial request
	let response = await fetch(url, {
		...options,
		credentials: "include",
	});

	// If we get a 401, try refreshing the token (deduplicated)
	if (response.status === 401) {
		const refreshed = await refreshToken();

		// If refresh succeeds, retry the original request
		if (refreshed) {
			response = await fetch(url, {
				...options,
				credentials: "include",
			});
		}
	}

	return response;
}
