import { useEffect, useRef } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useRepoStore } from "@/stores/repoStore";
import type { IRepositoryResponse } from "@/types/repos";

/**
 * Prefetches full repo data (branches, commits count, etc.) into the Zustand store
 * for a list of repo IDs. Skips repos already in the store.
 * Fire-and-forget: errors are silently ignored.
 */
export function usePrefetchRepos(repoIds: string[]) {
	const setRepo = useRepoStore((s) => s.setRepo);
	const hasPrefetchedRef = useRef(false);

	useEffect(() => {
		if (repoIds.length === 0 || hasPrefetchedRef.current) return;
		hasPrefetchedRef.current = true;

		const currentRepos = useRepoStore.getState().repos;

		for (const id of repoIds) {
			if (currentRepos[id]) continue;

			fetchWithAuth(`/api/repos/${id}`)
				.then((res) => {
					if (!res.ok) return;
					return res.json();
				})
				.then((data: IRepositoryResponse | undefined) => {
					if (!data) return;
					setRepo({
						...data.repository,
						branches: data.branches,
						commitsCount: data.commitsCount,
						isAccessible: data.isAccessible,
					});
				})
				.catch(() => {});
		}
	}, [repoIds, setRepo]);
}
