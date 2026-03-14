/**
 * Factories for mock user objects returned by getCurrentUser() and Prisma.
 *
 * Usage:
 *   import { getCurrentUser } from "@/lib/server/session"
 *   import { mockUser } from "@/tests/helpers/user"
 *
 *   vi.mocked(getCurrentUser).mockResolvedValue(mockUser())
 *   vi.mocked(getCurrentUser).mockResolvedValue(mockUser({ id: "specific-id" }))
 */

import type { Provider } from "@/generated/prisma/enums";

/** The shape returned by getCurrentUser() */
export type MockCurrentUser = {
	id: string;
	email: string;
	username: string;
	createdAt: Date;
	updatedAt: Date;
	hasPassword: boolean;
	oauthProviders: Provider[];
};

/** The full DB User row shape (returned by prisma.user.*) */
export type MockDbUser = {
	id: string;
	email: string;
	username: string;
	password: string | null;
	createdAt: Date;
	updatedAt: Date;
	oauthIds: { provider: string; providerUserId: string }[];
};

export function mockUser(overrides: Partial<MockCurrentUser> = {}): MockCurrentUser {
	return {
		id: "user-test-id-1234",
		email: "test@example.com",
		username: "testuser",
		createdAt: new Date("2025-01-01T00:00:00Z"),
		updatedAt: new Date("2025-01-01T00:00:00Z"),
		hasPassword: true,
		oauthProviders: [],
		...overrides,
	};
}

export function mockDbUser(overrides: Partial<MockDbUser> = {}): MockDbUser {
	return {
		id: "user-test-id-1234",
		email: "test@example.com",
		username: "testuser",
		password: "$argon2id$v=19$m=65536,t=3,p=4$mockhash",
		createdAt: new Date("2025-01-01T00:00:00Z"),
		updatedAt: new Date("2025-01-01T00:00:00Z"),
		oauthIds: [],
		...overrides,
	};
}
