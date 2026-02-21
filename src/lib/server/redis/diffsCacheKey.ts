/**
 * Builds a Redis cache key for prefetched file diffs.
 */
export function buildDiffsCacheKey(
	repoId: string,
	baseBranch: string,
	compareBranch: string,
): string {
	return `prefetch:diffs:${repoId}:${baseBranch}:${compareBranch}`;
}
