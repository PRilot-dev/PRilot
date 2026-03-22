import type { ChatStreamChunk } from "@/lib/server/interfaces";

export class SSEUserError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SSEUserError";
	}
}

export type SSESend = (event: string, data: unknown) => void;

const SSE_HEADERS = {
	"Content-Type": "text/event-stream",
	"Cache-Control": "no-cache, no-transform",
	Connection: "keep-alive",
	"X-Accel-Buffering": "no",
} as const;

/**
 * Creates an SSE Response that flushes the Node.js HTTP buffer,
 * provides a `send(event, data)` helper, and handles errors/cleanup.
 *
 * @param handler  Async function receiving `send` — do your streaming work here.
 * @param label    Log prefix for errors (e.g. "[FAST]", "[DEEP]").
 */
export function createSSEResponse(
	handler: (send: SSESend) => Promise<void>,
	label: string,
): Response {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			// Flush Node.js internal HTTP buffer (~16KB padding comment).
			// SSE comments (: ...) are ignored by the client parser.
			controller.enqueue(
				encoder.encode(`: ${" ".repeat(16384)}\n\n`),
			);

			const send: SSESend = (event, data) => {
				controller.enqueue(
					encoder.encode(
						`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
					),
				);
			};

			try {
				await handler(send);
			} catch (err) {
				console.error(`${label} Stream error:`, err);
				const userMessage =
					err instanceof SSEUserError
						? err.message
						: "Something went wrong generating the PR. Please try again.";
				try {
					controller.enqueue(
						encoder.encode(
							`event: error\ndata: ${JSON.stringify({ message: userMessage })}\n\n`,
						),
					);
				} catch {
					// Controller already closed
				}
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, { headers: SSE_HEADERS });
}

export interface LLMStreamResult {
	text: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

/**
 * Iterates a streaming completion, sends each token as an SSE event,
 * and returns the accumulated text + usage stats from the final chunk.
 */
export async function streamLLMTokens(
	completion: AsyncIterable<ChatStreamChunk>,
	send: SSESend,
): Promise<LLMStreamResult> {
	let accumulated = "";
	let usage: LLMStreamResult["usage"];

	for await (const chunk of completion) {
		if (chunk.delta) {
			accumulated += chunk.delta;
			send("token", { token: chunk.delta });
		}

		if (chunk.usage) {
			usage = chunk.usage;
		}
	}

	return { text: accumulated, usage };
}
