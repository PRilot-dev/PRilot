import type { SSESend } from "@/lib/server/ai/streamSSE";
import type { PRLanguage } from "@/types/languages";
import type { CompareResult } from "./utils";

/** Output of a successful PR generation. */
export interface PRGenerationOutput {
	title: string;
	description: string;
}

/** Input passed to the pipeline. */
export interface PRGenerationInput {
	compareData: CompareResult;
	language: PRLanguage;
	compareBranch: string;
	send: SSESend;
}

/**
 * Strategy interface for PR generation modes.
 * Each strategy encapsulates mode-specific logic:
 * validation rules, prompt construction, and retry criteria.
 */
export interface PRGenerationStrategy {
	/** Log label for this mode (e.g. "[FAST]", "[DEEP]"). */
	readonly label: string;

	/** Validate compare data. Throw BadRequestError if invalid. */
	validate(data: CompareResult): void;

	/** Build the messages array for the AI completion. */
	buildMessages(
		data: CompareResult,
		language: PRLanguage,
		compareBranch: string,
	): Array<{ role: "system" | "user" | "assistant"; content: string }>;

	/** Should the pipeline retry if the first attempt produced this result? */
	shouldRetry(parsed: PRGenerationOutput): boolean;
}
