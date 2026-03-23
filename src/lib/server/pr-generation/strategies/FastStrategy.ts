import { buildPRFromCommits } from "@/lib/server/ai/prompt";
import { BadRequestError } from "@/lib/server/error";
import type { PRLanguage } from "@/types/languages";
import type { PRGenerationOutput, PRGenerationStrategy } from "../types";
import type { CompareResult } from "../utils";

export class FastStrategy implements PRGenerationStrategy {
	readonly label = "[FAST]";

	validate(data: CompareResult): void {
		if (!data.commits.length) {
			throw new BadRequestError("No commits found between branches");
		}
	}

	buildMessages(
		data: CompareResult,
		language: PRLanguage,
		compareBranch: string,
	): Array<{ role: "system" | "user" | "assistant"; content: string }> {
		return [
			{
				role: "system",
				content: buildPRFromCommits(language, compareBranch),
			},
			{
				role: "user",
				content: data.commits
					.map((c, i) => `${i + 1}. ${c}`)
					.join("\n"),
			},
		];
	}

	shouldRetry(_parsed: PRGenerationOutput): boolean {
		return false;
	}
}
