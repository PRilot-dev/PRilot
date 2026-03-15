import { describe, expect, it } from "vitest";
import { getPercentageChange } from "@/lib/utils/stats";

describe("getPercentageChange", () => {
	it("returns 0 when both values are zero", () => {
		// ACT & ASSERT
		expect(getPercentageChange(0, 0)).toBe(0);
	});

	it("returns 100 when previous is zero and current is positive", () => {
		// ACT & ASSERT
		expect(getPercentageChange(5, 0)).toBe(100);
	});

	it("calculates positive change", () => {
		// ACT & ASSERT
		expect(getPercentageChange(15, 10)).toBe(50);
	});

	it("calculates negative change", () => {
		// ACT & ASSERT
		expect(getPercentageChange(5, 10)).toBe(-50);
	});

	it("returns 0 when values are equal", () => {
		// ACT & ASSERT
		expect(getPercentageChange(10, 10)).toBe(0);
	});

	it("handles 100% increase (doubling)", () => {
		// ACT & ASSERT
		expect(getPercentageChange(20, 10)).toBe(100);
	});
});
