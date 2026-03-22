import type { Redis } from "@upstash/redis";
import type { ICacheProvider } from "@/lib/server/interfaces";

export class UpstashCacheProvider implements ICacheProvider {
	constructor(private readonly redis: Redis) {}

	async get<T = unknown>(key: string): Promise<T | null> {
		return this.redis.get<T>(key);
	}

	async set(
		key: string,
		value: unknown,
		options?: { ttlSeconds?: number; keepTtl?: boolean },
	): Promise<void> {
		if (options?.keepTtl) {
			await this.redis.set(key, value, { keepTtl: true });
		} else if (options?.ttlSeconds) {
			await this.redis.set(key, value, { ex: options.ttlSeconds });
		} else {
			await this.redis.set(key, value);
		}
	}

	async del(key: string): Promise<void> {
		await this.redis.del(key);
	}
}
