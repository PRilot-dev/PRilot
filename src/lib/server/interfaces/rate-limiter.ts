/** Result of a rate limit check. */
export interface RateLimitResult {
	/** Whether the request is allowed. */
	success: boolean;
	/** Timestamp (ms) when the current window resets. */
	reset: number;
	/** Remaining requests in the current window. */
	remaining: number;
}

/**
 * A single rate limiter instance (one per limit policy).
 * Current implementation: Upstash Ratelimit.
 */
export interface IRateLimiter {
	/** Consume one request for the given identifier. */
	limit(identifier: string): Promise<RateLimitResult>;

	/** Check remaining capacity without consuming a request. */
	getRemaining(
		identifier: string,
	): Promise<{ remaining: number; reset: number }>;
}
