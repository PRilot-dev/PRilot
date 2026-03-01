/**
 * Builds a Redis cache key for prefetched GitHub compare data (diffs + commits).
 */
export function buildCompareCacheKey(
	repoId: string,
	baseBranch: string,
	compareBranch: string,
): string {
	return `prefetch:compare:${repoId}:${baseBranch}:${compareBranch}`;
}
