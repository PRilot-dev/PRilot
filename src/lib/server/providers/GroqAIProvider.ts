import type Groq from "groq-sdk";
import type {
	ChatCompletionParams,
	ChatStreamChunk,
	IAIProvider,
} from "@/lib/server/interfaces";

export class GroqAIProvider implements IAIProvider {
	constructor(private readonly groq: Groq) {}

	async createStreamingCompletion(
		params: ChatCompletionParams,
	): Promise<AsyncIterable<ChatStreamChunk>> {
		const completion = await this.groq.chat.completions.create({
			model: params.model,
			messages: params.messages,
			response_format: params.responseFormat
				? { type: params.responseFormat.type }
				: undefined,
			temperature: params.temperature,
			stream: true,
		});

		return this.transformStream(completion);
	}

	private async *transformStream(
		completion: AsyncIterable<unknown>,
	): AsyncIterable<ChatStreamChunk> {
		for await (const chunk of completion) {
			const typed = chunk as {
				choices?: { delta?: { content?: string | null } }[];
				x_groq?: {
					usage?: {
						prompt_tokens?: number;
						completion_tokens?: number;
						total_tokens?: number;
					};
				};
			};

			const delta = typed.choices?.[0]?.delta?.content ?? null;
			const groqUsage = typed.x_groq?.usage;

			yield {
				delta,
				usage: groqUsage?.total_tokens
					? {
							promptTokens: groqUsage.prompt_tokens ?? 0,
							completionTokens: groqUsage.completion_tokens ?? 0,
							totalTokens: groqUsage.total_tokens,
						}
					: undefined,
			};
		}
	}
}
