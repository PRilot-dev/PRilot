import { describe, expect, it } from "vitest";
import { TooManyRequestsError } from "@/lib/server/error";
import { rateLimitOrThrow } from "@/lib/server/redis/rate-limit";

describe("rateLimitOrThrow", () => {
	it("returns remaining and reset when limit is not exceeded", () => {
		// ACT
		const result = rateLimitOrThrow({
			success: true,
			remaining: 5,
			reset: 1234567890,
		});

		// ASSERT
		expect(result).toEqual({ remaining: 5, reset: 1234567890 });
	});

	it("throws TooManyRequestsError when limit is exceeded", () => {
		// ACT & ASSERT
		expect(() =>
			rateLimitOrThrow({
				success: false,
				remaining: 0,
				reset: Date.now() + 30_000,
			}),
		).toThrow(TooManyRequestsError);
	});

	it("uses custom message when provided", () => {
		// ACT & ASSERT
		try {
			rateLimitOrThrow(
				{ success: false, remaining: 0, reset: Date.now() + 30_000 },
				"Slow down!",
			);
		} catch (err) {
			expect((err as Error).message).toBe("Slow down!");
		}
	});

	it("includes retry time in default message", () => {
		// ACT & ASSERT
		try {
			rateLimitOrThrow({
				success: false,
				remaining: 0,
				reset: Date.now() + 65_000,
			});
		} catch (err) {
			expect((err as Error).message).toContain("1min");
		}
	});
});
