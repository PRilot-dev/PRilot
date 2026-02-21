import { useEffect, useRef } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const DEBOUNCE_MS = 600;

/**
 * Prefetches file diffs for deep PR generation when both branches are selected.
 * Fire-and-forget: errors are silently ignored.
 */
export function usePrefetchDiffs(
	repoId: string,
	baseBranch: string,
	compareBranch: string,
	mode: "fast" | "deep",
) {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastPrefetchedRef = useRef("");

	useEffect(() => {
		if (mode !== "deep") return;
		if (!baseBranch || !compareBranch || baseBranch === compareBranch) return;

		const key = `${repoId}:${baseBranch}:${compareBranch}`;
		if (lastPrefetchedRef.current === key) return;

		if (timeoutRef.current) clearTimeout(timeoutRef.current);

		timeoutRef.current = setTimeout(() => {
			lastPrefetchedRef.current = key;

			fetchWithAuth(
				`/api/repos/${repoId}/pull-requests/generate/deep/prefetch`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ baseBranch, compareBranch }),
				},
			).catch(() => {});
		}, DEBOUNCE_MS);

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [repoId, baseBranch, compareBranch, mode]);
}
