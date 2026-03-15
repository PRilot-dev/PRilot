import { describe, expect, it } from "vitest";
import { formatMinutesSeconds } from "@/lib/utils/formatDateTime";

describe("formatMinutesSeconds", () => {
	it("formats seconds only when under a minute", () => {
		// ACT & ASSERT
		expect(formatMinutesSeconds(45)).toBe("45s");
	});

	it("formats minutes and seconds", () => {
		// ACT & ASSERT
		expect(formatMinutesSeconds(125)).toBe("2min 5s");
	});

	it("formats exact minutes with 0 seconds", () => {
		// ACT & ASSERT
		expect(formatMinutesSeconds(60)).toBe("1min 0s");
	});

	it("formats zero seconds", () => {
		// ACT & ASSERT
		expect(formatMinutesSeconds(0)).toBe("0s");
	});
});
