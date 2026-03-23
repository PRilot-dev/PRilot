import { buildPRFromDiffs } from "@/lib/server/ai/prompt";
import { BadRequestError } from "@/lib/server/error";
import { prepareFileDiffForAI } from "@/lib/server/github/fileDiffs";
import type { PRLanguage } from "@/types/languages";
import type { PRGenerationOutput, PRGenerationStrategy } from "../types";
import type { CompareResult } from "../utils";

const MAX_CHANGES = 500;
const MIN_DESCRIPTION_LENGTH = 500;

export class DeepStrategy implements PRGenerationStrategy {
	readonly label = "[DEEP]";

	validate(data: CompareResult): void {
		if (!data.files || data.files.length === 0) {
			throw new BadRequestError(
				"No file changes found between branches",
			);
		}

		const totalChanges = data.files.reduce(
			(sum, f) => sum + f.changes,
			0,
		);
		if (totalChanges > MAX_CHANGES) {
			throw new BadRequestError(
				"Too many lines changed (max 500 for deep mode). Please use fast mode instead.",
			);
		}
	}

	buildMessages(
		data: CompareResult,
		language: PRLanguage,
		compareBranch: string,
	): Array<{ role: "system" | "user" | "assistant"; content: string }> {
		const files = data.files ?? [];
		const rawDiffs = files
			.map((f) => prepareFileDiffForAI(f).patch)
			.join("\n\n");

		const commitSection =
			data.commits.length > 0
				? `\n\nCommit messages:\n${data.commits.map((c) => `- ${c}`).join("\n")}`
				: "";

		return [
			{
				role: "system",
				content: buildPRFromDiffs(language, compareBranch),
			},
			{
				role: "user",
				content: `File diffs:\n${rawDiffs}${commitSection}`,
			},
		];
	}

	shouldRetry(parsed: PRGenerationOutput): boolean {
		return parsed.description.length < MIN_DESCRIPTION_LENGTH;
	}
}
