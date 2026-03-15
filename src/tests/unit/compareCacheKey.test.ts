import { describe, expect, it } from "vitest";
import { buildCompareCacheKey } from "@/lib/server/redis/compareCacheKey";

describe("buildCompareCacheKey", () => {
	it("builds the expected key format", () => {
		// ACT
		const key = buildCompareCacheKey("repo-123", "main", "feature/login");

		// ASSERT
		expect(key).toBe("prefetch:compare:repo-123:main:feature/login");
	});

	it("produces different keys for different branches", () => {
		// ACT
		const a = buildCompareCacheKey("repo-1", "main", "feat-a");
		const b = buildCompareCacheKey("repo-1", "main", "feat-b");

		// ASSERT
		expect(a).not.toBe(b);
	});
});
