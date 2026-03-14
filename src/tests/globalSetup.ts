/**
 * Vitest globalSetup — runs ONCE in the main process before any workers start.
 *
 * Responsibilities:
 *  - Apply pending Prisma migrations to the test database so every test
 *    file starts with an up-to-date schema.
 *
 * The test database is assumed to be already running (docker-compose.test.yml).
 * Start it with: docker compose -f docker-compose.test.yml up -d
 */

import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./db.ts";

export async function setup() {
	console.log("\n[test] Applying migrations to test database…");

	execSync("npx prisma migrate deploy", {
		env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
		stdio: "inherit",
	});

	console.log("[test] Migrations applied.\n");
}

export async function teardown() {
	// Nothing to tear down — the DB container lifecycle is managed externally.
}
