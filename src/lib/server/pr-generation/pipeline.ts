import { fixDescriptionHeaders } from "@/lib/server/ai/prompt";
import { streamLLMTokens } from "@/lib/server/ai/streamSSE";
import type { IAIProvider } from "@/lib/server/interfaces";
import type { IPRResponse } from "@/types/pullRequests";
import type {
	PRGenerationInput,
	PRGenerationOutput,
	PRGenerationStrategy,
} from "./types";

/**
 * Orchestrates PR generation: validate → stream AI completion → parse → retry if needed.
 * Route-level concerns (auth, rate limiting, credits) stay in the route handler.
 */
export class PRGenerationPipeline {
	constructor(private readonly ai: IAIProvider) {}

	/**
	 * Generate a PR title + description using the given strategy.
	 * Returns null if generation fails after retry (error already sent via SSE).
	 */
	async generate(
		strategy: PRGenerationStrategy,
		input: PRGenerationInput,
	): Promise<PRGenerationOutput | null> {
		const { compareData, language, compareBranch, send } = input;

		// 1. Validate
		strategy.validate(compareData);

		// 2. Build messages
		const messages = strategy.buildMessages(
			compareData,
			language,
			compareBranch,
		);

		// 3. First attempt
		const t0 = performance.now();
		let result = await this.streamCompletion(messages, send);
		console.log(
			`${strategy.label} PR generation streamed: ${(performance.now() - t0).toFixed(0)}ms | tokens: ${result.usage?.promptTokens ?? "?"}in/${result.usage?.completionTokens ?? "?"}out/${result.usage?.totalTokens ?? "?"}total`,
		);

		let parsed = JSON.parse(result.text) as IPRResponse;

		// 4. Retry if strategy says so
		if (strategy.shouldRetry(parsed)) {
			console.log(
				`${strategy.label} Description too short (${parsed.description.length} chars), retrying...`,
			);
			send("retry", {});

			const t1 = performance.now();
			result = await this.streamCompletion(messages, send);
			console.log(
				`${strategy.label} PR generation retry streamed: ${(performance.now() - t1).toFixed(0)}ms | tokens: ${result.usage?.promptTokens ?? "?"}in/${result.usage?.completionTokens ?? "?"}out/${result.usage?.totalTokens ?? "?"}total`,
			);

			parsed = JSON.parse(result.text) as IPRResponse;

			if (strategy.shouldRetry(parsed)) {
				send("error", {
					message:
						"AI generated a description that was too short. Please try again.",
				});
				return null;
			}
		}

		// 5. Fix headers and return
		return {
			title: parsed.title,
			description: fixDescriptionHeaders(parsed.description),
		};
	}

	// ==================================
	// ======== Internal helpers ========
	// ==================================

	private async streamCompletion(
		messages: Array<{
			role: "system" | "user" | "assistant";
			content: string;
		}>,
		send: Parameters<typeof streamLLMTokens>[1],
	) {
		const completion = await this.ai.createStreamingCompletion({
			model: "openai/gpt-oss-120b",
			messages,
			responseFormat: { type: "json_object" },
			temperature: 0.4,
		});

		return streamLLMTokens(completion, send);
	}
}
