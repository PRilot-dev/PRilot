import { describe, expect, it } from "vitest";
import { parsePartialPRJson } from "@/lib/utils/parsePartialPRJson";

describe("parsePartialPRJson", () => {
	it("parses complete valid JSON", () => {
		// ARRANGE
		const raw = JSON.stringify({ title: "Fix login", description: "Fixes the login bug" });

		// ACT
		const result = parsePartialPRJson(raw);

		// ASSERT
		expect(result).toEqual({ title: "Fix login", description: "Fixes the login bug" });
	});

	it("extracts title from partial JSON (no closing brace)", () => {
		// ARRANGE
		const raw = '{"title":"Add auth"';

		// ACT
		const result = parsePartialPRJson(raw);

		// ASSERT
		expect(result.title).toBe("Add auth");
		expect(result.description).toBe("");
	});

	it("extracts both fields from partial JSON (description truncated)", () => {
		// ARRANGE
		const raw = '{"title":"Add auth","description":"This PR adds';

		// ACT
		const result = parsePartialPRJson(raw);

		// ASSERT
		expect(result.title).toBe("Add auth");
		expect(result.description).toBe("This PR adds");
	});

	it("handles escaped quotes in values", () => {
		// ARRANGE
		const raw = '{"title":"Fix \\"edge\\" case","description":"Done"}';

		// ACT
		const result = parsePartialPRJson(raw);

		// ASSERT
		expect(result.title).toBe('Fix "edge" case');
		expect(result.description).toBe("Done");
	});

	it("handles newlines in description", () => {
		// ARRANGE
		const raw = '{"title":"Update","description":"Line 1\\nLine 2"}';

		// ACT
		const result = parsePartialPRJson(raw);

		// ASSERT
		expect(result.description).toBe("Line 1\nLine 2");
	});

	it("handles partial escape sequence at end of stream", () => {
		// ARRANGE
		const raw = '{"title":"Fix bug","description":"Some text\\';

		// ACT
		const result = parsePartialPRJson(raw);

		// ASSERT
		expect(result.title).toBe("Fix bug");
		expect(result.description).toBe("Some text");
	});

	it("handles whitespace after colon", () => {
		// ARRANGE
		const raw = '{"title" : "Spaced out"';

		// ACT
		const result = parsePartialPRJson(raw);

		// ASSERT
		expect(result.title).toBe("Spaced out");
	});

	it("returns empty strings for empty input", () => {
		// ACT
		const result = parsePartialPRJson("");

		// ASSERT
		expect(result).toEqual({ title: "", description: "" });
	});

	it("returns empty strings when no fields are present", () => {
		// ACT
		const result = parsePartialPRJson("{");

		// ASSERT
		expect(result).toEqual({ title: "", description: "" });
	});

	it("handles missing title but present description", () => {
		// ARRANGE
		const raw = '{"description":"Only desc"}';

		// ACT
		const result = parsePartialPRJson(raw);

		// ASSERT
		expect(result.title).toBe("");
		expect(result.description).toBe("Only desc");
	});
});
