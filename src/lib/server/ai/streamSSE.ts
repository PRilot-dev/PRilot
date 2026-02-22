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
				try {
					controller.enqueue(
						encoder.encode(
							`event: error\ndata: ${JSON.stringify({ message: err instanceof Error ? err.message : "Unexpected server error" })}\n\n`,
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

/**
 * Iterates a Cerebras streaming completion, sends each token as an SSE event,
 * and returns the accumulated raw text.
 */
export async function streamCerebrasTokens(
	completion: AsyncIterable<unknown>,
	send: SSESend,
): Promise<string> {
	let accumulated = "";
	for await (const chunk of completion) {
		const delta = (
			chunk as {
				choices?: {
					delta?: { content?: string | null };
				}[];
			}
		).choices?.[0]?.delta?.content;
		if (delta) {
			accumulated += delta;
			send("token", { token: delta });
		}
	}
	return accumulated;
}
