import { describe, expect, it, vi } from "vitest";
import type { IGitHubFile } from "@/types/commits";

// Undo the global mock so we test the real implementation
vi.unmock("@/lib/server/github/fileDiffs");

import { prepareFileDiffForAI } from "@/lib/server/github/fileDiffs";

function makeFile(overrides: Partial<IGitHubFile> & { filename: string; status: string }): IGitHubFile {
	return { changes: 0, additions: 0, deletions: 0, patch: undefined, ...overrides } as IGitHubFile;
}

describe("prepareFileDiffForAI", () => {
	it("formats a modified file with patch", () => {
		// ARRANGE
		const file = makeFile({
			filename: "src/index.ts",
			status: "modified",
			changes: 5,
			additions: 3,
			deletions: 2,
			patch: "+added line\n-removed line",
		});

		// ACT
		const result = prepareFileDiffForAI(file);

		// ASSERT
		expect(result.filename).toBe("src/index.ts");
		expect(result.status).toBe("modified");
		expect(result.changes).toBe(5);
		expect(result.patch).toContain("diff --git a/src/index.ts b/src/index.ts");
		expect(result.patch).toContain("status: modified");
		expect(result.patch).toContain("+added line");
	});

	it("formats a deleted file", () => {
		// ARRANGE
		const file = makeFile({
			filename: "src/old.ts",
			status: "deleted",
			changes: 10,
			deletions: 10,
		});

		// ACT
		const result = prepareFileDiffForAI(file);

		// ASSERT
		expect(result.patch).toContain("--- a/src/old.ts");
		expect(result.patch).toContain("+++ /dev/null");
		expect(result.patch).toContain("File deleted.");
	});

	it("handles a file with no patch (binary or too large)", () => {
		// ARRANGE
		const file = makeFile({
			filename: "image.png",
			status: "added",
		});

		// ACT
		const result = prepareFileDiffForAI(file);

		// ASSERT
		expect(result.patch).toContain("diff is unavailable");
		expect(result.patch).toContain("image.png");
	});

	it("formats an added file with patch", () => {
		// ARRANGE
		const file = makeFile({
			filename: "src/new.ts",
			status: "added",
			changes: 3,
			additions: 3,
			patch: "+export const foo = 1;",
		});

		// ACT
		const result = prepareFileDiffForAI(file);

		// ASSERT
		expect(result.patch).toContain("status: added");
		expect(result.patch).toContain("+export const foo = 1;");
	});
});
