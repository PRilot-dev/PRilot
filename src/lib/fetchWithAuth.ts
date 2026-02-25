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

	// If we get a 401, try refreshing the token
	if (response.status === 401) {
		const refreshResponse = await fetch("/api/auth/refresh", {
			method: "POST",
			credentials: "include",
		});

		// If refresh succeeds, retry the original request
		if (refreshResponse.ok) {
			response = await fetch(url, {
				...options,
				credentials: "include",
			});
		}
	}

	return response;
}
