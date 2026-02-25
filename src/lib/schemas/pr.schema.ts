import { z } from "zod";

export const languageSchema = z.enum([
	"English",
	"French",
	"Spanish",
	"German",
	"Portuguese",
	"Italian",
]);

// Pull Request database item creation schema
export const createPrSchema = z.object({
	prTitle: z
		.string()
		.min(3, "Title is too short")
		.max(256, "Title is too long")
		.trim(),

	prBody: z
		.string()
		.min(3, "PR body is too short")
		.max(20_000, "PR body is too long"),

	baseBranch: z
		.string()
		.min(1, "Base branch is required")
		.regex(/^[\w./-]+$/, "Invalid branch name"),

	compareBranch: z
		.string()
		.min(1, "Head branch is required")
		.regex(/^[\w./-]+$/, "Invalid branch name"),

	language: languageSchema.default("English"),

	mode: z.enum(["fast", "deep"]).default("fast"),
});

// Pull Request database item update schema
export const updatePrSchema = z.object({
	prTitle: z
		.string()
		.min(3, "Title is too short")
		.max(256, "Title is too long")
		.trim(),

	prBody: z
		.string()
		.min(3, "PR body is too short")
		.max(20_000, "PR body is too long"),

	baseBranch: z
		.string()
		.min(1, "Base branch is required")
		.regex(/^[\w./-]+$/, "Invalid branch name")
		.optional(),

	compareBranch: z
		.string()
		.min(1, "Head branch is required")
		.regex(/^[\w./-]+$/, "Invalid branch name")
		.optional(),

	language: languageSchema.optional(),

	mode: z.enum(["fast", "deep"]).optional(),
});
