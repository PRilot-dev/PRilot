import { vi } from "vitest";
import type { IPRResponse } from "@/types/pullRequests";

// AI provider — all routes import from here
vi.mock("@/lib/server/providers/ai", () => ({
	aiProvider: {
		createStreamingCompletion: vi.fn(),
	},
}));

// AI prompt helpers — passthrough
vi.mock("@/lib/server/ai/prompt", () => ({
	buildPRFromCommits: vi.fn().mockReturnValue("system prompt"),
	buildPRFromDiffs: vi.fn().mockReturnValue("system prompt"),
	fixDescriptionHeaders: vi.fn().mockImplementation((d: string) => d),
}));

// SSE streaming — instead of creating a real ReadableStream, call the handler
// and return a plain JSON Response so tests can easily inspect the result.
const defaultPR: IPRResponse = {
	title: "feat: add login",
	description: "Adds login feature",
};

vi.mock("@/lib/server/ai/streamSSE", () => ({
	createSSEResponse: vi.fn().mockImplementation(
		(handler: (send: (event: string, data: unknown) => void) => Promise<void>) => {
			let result: unknown = null;
			const send = (event: string, data: unknown) => {
				if (event === "done") result = data;
			};
			// Match real createSSEResponse behavior: errors inside the handler
			// are caught and sent as error SSE events, not re-thrown.
			return handler(send)
				.then(() => Response.json(result ?? defaultPR, { status: 200 }))
				.catch((err: Error & { status?: number }) => {
					// SSEUserError = validation error shown to client (400)
					const status = err.name === "SSEUserError" ? 400 : (err.status ?? 500);
					const message = err.message ?? "Internal server error";
					return Response.json({ error: message }, { status });
				});
		},
	),
	streamLLMTokens: vi.fn().mockResolvedValue({
		text: JSON.stringify(defaultPR),
		usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
	}),
	SSEUserError: class SSEUserError extends Error {
		constructor(message: string) {
			super(message);
			this.name = "SSEUserError";
		}
	},
}));

// PR generation — pass through real classes, mock only utility functions
vi.mock("@/lib/server/pr-generation", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/lib/server/pr-generation")>();
	return {
		...actual,
		fetchCachedCompareData: vi.fn().mockResolvedValue({
			commits: ["feat: first commit", "fix: second commit"],
			files: [],
			cacheHit: false,
		}),
		checkMonthlyLimit: vi.fn().mockResolvedValue({
			monthlyLimitKey: "ai:month:user:test",
			isOwner: true,
		}),
	};
});
