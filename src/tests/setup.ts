/**
 * Vitest per-file setup — runs before every test file in the worker process.
 *
 * All vi.mock() registrations live in focused files under ./mocks/.
 * This file imports them to activate the mocks, then handles lifecycle hooks
 * (database cleanup, prisma disconnect).
 *
 * Provider mocks (rate-limiters, email, git, cache, session, AI provider,
 * OAuth, redis client) have been removed — they are now injected directly
 * via factory functions in each test file.
 */

import { afterAll, beforeEach } from "vitest";
import { clearDatabase, testPrisma } from "./db";

// Activate all mocks — import order does not matter for vi.mock() calls
import "./mocks/next";
import "./mocks/config";
import "./mocks/db";
import "./mocks/auth";
import "./mocks/ai";

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

// Clean state before every test so each test is fully independent
beforeEach(async () => {
	await clearDatabase();
});

// Disconnect the Prisma client after all tests in the file are done
afterAll(async () => {
	await testPrisma.$disconnect();
});
