import { buildPRFromCommits } from "@/lib/server/ai/prompt";
import { SSEUserError } from "@/lib/server/ai/streamSSE";
import type { PRLanguage } from "@/types/languages";
import type { PRGenerationOutput, PRGenerationStrategy } from "../types";
import type { CompareResult } from "../utils";

export class FastStrategy implements PRGenerationStrategy {
	readonly label = "[FAST]";

	validate(data: CompareResult): void {
		if (!data.commits.length) {
			throw new SSEUserError("No commits found between branches");
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
