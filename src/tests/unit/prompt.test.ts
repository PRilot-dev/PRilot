import { describe, expect, it, vi } from "vitest";

// Undo the global mock so we test the real implementation
vi.unmock("@/lib/server/ai/prompt");

import { buildPRFromCommits, buildPRFromDiffs, fixDescriptionHeaders } from "@/lib/server/ai/prompt";

describe("fixDescriptionHeaders", () => {
	it("converts numbered list items to ### headers", () => {
		// ARRANGE
		const input = "1. **Auth flow**\nSome text\n2. **API changes**";

		// ACT
		const result = fixDescriptionHeaders(input);

		// ASSERT
		expect(result).toContain("### 1. **Auth flow**");
		expect(result).toContain("### 2. **API changes**");
	});

	it("strips inline code backticks", () => {
		// ARRANGE
		const input = "Updated the `handleLogin` function and `authMiddleware`";

		// ACT
		const result = fixDescriptionHeaders(input);

		// ASSERT
		expect(result).toBe("Updated the handleLogin function and authMiddleware");
	});

	it("handles both fixes together", () => {
		// ARRANGE
		const input = "1. **Update `config` module**\nChanged `timeout` value";

		// ACT
		const result = fixDescriptionHeaders(input);

		// ASSERT
		expect(result).toContain("### 1. **Update config module**");
		expect(result).toContain("Changed timeout value");
	});

	it("leaves already correct headers unchanged", () => {
		// ARRANGE
		const input = "### 1. **Auth flow**\nSome text";

		// ACT
		const result = fixDescriptionHeaders(input);

		// ASSERT
		expect(result).toBe("### 1. **Auth flow**\nSome text");
	});
});

describe("buildPRFromCommits", () => {
	it("includes language and branch in prompt", () => {
		// ACT
		const result = buildPRFromCommits("French", "feature/login");

		// ASSERT
		expect(result).toContain("French");
		expect(result).toContain("feature/login");
	});

	it("uses localized section headers", () => {
		// ACT
		const result = buildPRFromCommits("French", "main");

		// ASSERT
		expect(result).toContain("Résumé");
		expect(result).toContain("Modifications");
		expect(result).toContain("Comment tester");
	});
});

describe("buildPRFromDiffs", () => {
	it("includes language and branch in prompt", () => {
		// ACT
		const result = buildPRFromDiffs("Spanish", "feature/api");

		// ASSERT
		expect(result).toContain("Spanish");
		expect(result).toContain("feature/api");
	});

	it("uses localized section headers", () => {
		// ACT
		const result = buildPRFromDiffs("German", "main");

		// ASSERT
		expect(result).toContain("Zusammenfassung");
		expect(result).toContain("Änderungen");
		expect(result).toContain("Testanleitung");
	});
});
