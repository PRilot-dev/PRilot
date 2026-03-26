import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { config } from "../lib/server/config.ts";

const adapter = new PrismaPg({ connectionString: config.db.url });
export const prisma = new PrismaClient({ adapter });

export * from "../generated/prisma/client.ts";
