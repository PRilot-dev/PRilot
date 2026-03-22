/**
 * Key-value cache interface.
 * Current implementation: Upstash Redis.
 */
export interface ICacheProvider {
	/** Get a value by key. Returns null if not found or expired. */
	get<T = unknown>(key: string): Promise<T | null>;

	/** Set a value with optional TTL in seconds. Use keepTtl to preserve existing expiry. */
	set(
		key: string,
		value: unknown,
		options?: { ttlSeconds?: number; keepTtl?: boolean },
	): Promise<void>;

	/** Delete a key. */
	del(key: string): Promise<void>;
}
