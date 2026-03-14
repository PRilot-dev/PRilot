/**
 * Vitest per-file setup — runs before every test file in the worker process.
 *
 * All vi.mock() registrations live in focused files under ./mocks/.
 * This file imports them to activate the mocks, then handles lifecycle hooks
 * (database cleanup, redis reset, prisma disconnect).
 *
 * Per-test overrides:
 *   import { getCurrentUser } from "@/lib/server/session"
 *   vi.mocked(getCurrentUser).mockResolvedValue(mockUser())
 *
 *   // Seed data directly through testPrisma:
 *   import { testPrisma } from "@/tests/db"
 *   await testPrisma.user.create({ data: { ... } })
 */

import { afterAll, beforeEach } from "vitest";
import { clearDatabase, testPrisma } from "./db";

// Activate all mocks — import order does not matter for vi.mock() calls
import "./mocks/next";
import "./mocks/config";
import "./mocks/db";
import "./mocks/auth";
import "./mocks/redis";
import "./mocks/email";
import "./mocks/github";
import "./mocks/ai";

// Re-export redisStore so existing tests can import it from setup
export { redisStore } from "./mocks/redis";

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

// Clean state before every test so each test is fully independent
beforeEach(async () => {
	const { redisStore } = await import("./mocks/redis");
	await clearDatabase();
	redisStore.clear();
});

// Disconnect the Prisma client after all tests in the file are done
afterAll(async () => {
	await testPrisma.$disconnect();
});
