import { vi } from "vitest";
import type { IPRResponse } from "@/types/pullRequests";

// AI client — no real Groq calls in tests
vi.mock("@/lib/server/ai/client", () => ({
	groq: {
		chat: {
			completions: {
				create: vi.fn(),
			},
		},
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
		async (handler: (send: (event: string, data: unknown) => void) => Promise<void>) => {
			let result: unknown = null;
			const send = (event: string, data: unknown) => {
				if (event === "done") result = data;
			};
			await handler(send);
			return Response.json(result ?? defaultPR, { status: 200 });
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

// PR generation helpers — cached compare data + monthly limit
vi.mock("@/lib/server/pr-generation", () => ({
	fetchCachedCompareData: vi.fn().mockResolvedValue({
		commits: ["feat: first commit", "fix: second commit"],
		files: [],
		cacheHit: false,
	}),
	checkMonthlyLimit: vi.fn().mockResolvedValue({
		monthlyLimitKey: "ai:month:user:test",
		isOwner: true,
	}),
}));
