/** A single chunk from a streaming chat completion. */
export interface ChatStreamChunk {
	/** Incremental text content (may be null for non-content chunks). */
	delta: string | null;
	/** Usage stats, present only on the final chunk (provider-dependent). */
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

/** Parameters for creating a streaming chat completion. */
export interface ChatCompletionParams {
	model: string;
	messages: Array<{
		role: "system" | "user" | "assistant";
		content: string;
	}>;
	responseFormat?: { type: "json_object" | "text" };
	temperature?: number;
}

/**
 * Provider-agnostic AI completion interface.
 * Prompt building and retry logic stay in the caller.
 * Current implementation: Groq SDK.
 */
export interface IAIProvider {
	/** Creates a streaming chat completion. Returns an async iterable of chunks. */
	createStreamingCompletion(
		params: ChatCompletionParams,
	): Promise<AsyncIterable<ChatStreamChunk>>;
}
