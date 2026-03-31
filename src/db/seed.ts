import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const blocks = [
  {
    slug: "summary",
    name: "Summary",
    description: "A high-level overview of what the PR does and why",
    promptConcise:
      "Write a 1-2 sentence summary of this pull request. Be direct and focus on the what, not the how.",
    promptStandard:
      "Write a concise summary (2-4 sentences) of this pull request. Cover what changed and why. Do not list individual files.",
    promptDetailed:
      "Write a thorough summary of this pull request. Explain the motivation, the approach taken, and any important context a reviewer should know. Keep it under one paragraph.",
  },
  {
    slug: "changes",
    name: "Changes",
    description: "A breakdown of the key changes made",
    promptConcise:
      "List the key changes in this PR as 2-4 short bullet points. Focus on the most important changes only.",
    promptStandard:
      "List the key changes in this PR as bullet points grouped by area (e.g. backend, frontend, config). Be specific but concise.",
    promptDetailed:
      "Provide a detailed breakdown of all changes in this PR, grouped by area. For each change, briefly explain what was done and why. Include file-level details where relevant.",
  },
  {
    slug: "how_to_test",
    name: "How to Test",
    description: "Step-by-step instructions for testing the changes",
    promptConcise:
      "Write 2-3 short steps to verify these changes work correctly.",
    promptStandard:
      "Write clear step-by-step testing instructions. Include setup steps if needed, the actions to test, and what the expected outcome should be.",
    promptDetailed:
      "Write comprehensive testing instructions covering the happy path and edge cases. Include setup steps, specific test scenarios with expected outcomes, and any areas that need extra attention from reviewers.",
  },
  {
    slug: "breaking_changes",
    name: "Breaking Changes",
    description: "Any changes that break existing behavior or APIs",
    promptConcise:
      "List any breaking changes in 1-2 bullet points. If there are no breaking changes, output nothing.",
    promptStandard:
      "List any breaking changes with a brief explanation of what broke and what consumers need to update. If there are no breaking changes, output nothing.",
    promptDetailed:
      "List all breaking changes with detailed migration steps. For each breaking change, explain what changed, why, and exactly what downstream consumers need to do to adapt. If there are no breaking changes, output nothing.",
  },
  {
    slug: "related_issues",
    name: "Related Issues",
    description: "Links to related issues, tickets, or discussions",
    promptConcise:
      "If the branch name or commit messages reference issue numbers, list them with Closes/Fixes/Relates-to prefix. Otherwise output nothing.",
    promptStandard:
      "If the branch name or commit messages reference issue numbers, list them with Closes/Fixes/Relates-to prefix and a one-line description. Otherwise output nothing.",
    promptDetailed:
      "If the branch name or commit messages reference issue numbers, list them with Closes/Fixes/Relates-to prefix and explain how this PR addresses each issue. Otherwise output nothing.",
  },
  {
    slug: "dependencies",
    name: "Dependencies",
    description: "Added, removed, or updated packages and libraries",
    promptConcise:
      "List any added, removed, or updated dependencies in 1-3 bullet points. If no dependency changes, output nothing.",
    promptStandard:
      "List any added, removed, or updated dependencies with their version changes and a brief reason for each change. If no dependency changes, output nothing.",
    promptDetailed:
      "List all dependency changes (added, removed, updated) with version numbers, the reason for each change, and any security or compatibility considerations. Flag any major version bumps. If no dependency changes, output nothing.",
  },
  {
    slug: "migration_notes",
    name: "Migration Notes",
    description: "Database or configuration migration steps",
    promptConcise:
      "If this PR includes database migrations, config changes, or environment variable changes, list them briefly. Otherwise output nothing.",
    promptStandard:
      "If this PR includes database migrations, config changes, or environment variable changes, list the required steps to apply them. Otherwise output nothing.",
    promptDetailed:
      "If this PR includes database migrations, config changes, or environment variable changes, provide detailed rollout instructions including the order of operations, rollback steps, and any downtime considerations. Otherwise output nothing.",
  },
  {
    slug: "checklist",
    name: "Checklist",
    description: "Pre-merge checklist items",
    promptConcise:
      "Output a short markdown checklist with 3-4 items relevant to this PR (e.g. tests pass, no console.logs, migrations run).",
    promptStandard:
      "Output a markdown checklist with 5-7 items relevant to this PR. Include items for testing, code quality, documentation, and deployment readiness.",
    promptDetailed:
      "Output a comprehensive markdown checklist covering testing, code quality, documentation, security considerations, performance impact, and deployment readiness. Tailor items to the specific changes in this PR.",
  },
  {
    slug: "reviewer_notes",
    name: "Reviewer Notes",
    description: "Guidance for reviewers on where to focus attention",
    promptConcise:
      "Write 1 sentence directing reviewers to the most important part of this PR to review carefully.",
    promptStandard:
      "Write 2-3 sentences guiding reviewers. Highlight which files or logic deserve the most scrutiny and why.",
    promptDetailed:
      "Write a short paragraph for reviewers explaining which areas need careful review, any tricky logic or design decisions you want feedback on, and areas where you are less confident about the approach.",
  },
];

async function seed() {
  console.log("Seeding block definitions...");

  for (const block of blocks) {
    await prisma.block.upsert({
      where: { slug: block.slug },
      update: {
        name: block.name,
        description: block.description,
        promptConcise: block.promptConcise,
        promptStandard: block.promptStandard,
        promptDetailed: block.promptDetailed,
      },
      create: block,
    });
    console.log(`  ✓ ${block.slug}`);
  }

  console.log(`\nSeeded ${blocks.length} block definitions.`);
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
