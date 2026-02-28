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

/**
 * Builds a Redis cache key for cached AI file-diff summaries (deep mode stage 1).
 */
export function buildSummaryCacheKey(
	repoId: string,
	baseBranch: string,
	compareBranch: string,
): string {
	return `summary:${repoId}:${baseBranch}:${compareBranch}`;
}
