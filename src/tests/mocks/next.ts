import { vi } from "vitest";

// next/headers — cookies() is used by token.ts / extractAccessToken
vi.mock("next/headers", () => ({
	cookies: vi.fn().mockResolvedValue({
		get: vi.fn().mockReturnValue(undefined),
		set: vi.fn(),
		delete: vi.fn(),
		has: vi.fn().mockReturnValue(false),
		getAll: vi.fn().mockReturnValue([]),
	}),
}));
