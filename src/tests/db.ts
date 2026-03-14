import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

export const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	"postgresql://postgres:postgres@localhost:5433/prilot_test";

const adapter = new PrismaPg({ connectionString: TEST_DATABASE_URL });

export const testPrisma = new PrismaClient({ adapter });

/**
 * Truncates every table in dependency order (RESTART IDENTITY CASCADE handles FKs).
 * Call this in beforeEach to guarantee a clean slate for every test.
 */
export async function clearDatabase() {
	await testPrisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      pull_requests,
      repository_blocks,
      repository_members,
      invitations,
      repositories,
      provider_installations,
      user_oauth,
      refresh_tokens,
      password_reset_tokens,
      blocks,
      users
    RESTART IDENTITY CASCADE
  `);
}
