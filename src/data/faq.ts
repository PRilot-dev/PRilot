export type FAQItem = {
	question: string;
	answer: string;
};

export type FAQCategory = {
	id: string;
	name: string;
	faqs: FAQItem[];
};

export const faqCategories: FAQCategory[] = [
	{
		id: "general",
		name: "General",
		faqs: [
			{
				question: "Does PRilot integrate directly with GitHub?",
				answer:
					"GitHub integration is fully supported, and GitLab support is coming soon. You'll be able to generate and send your Pull Request directly to your provider without leaving PRilot.",
			},
			{
				question: "How is this different from just using ChatGPT?",
				answer:
					"PRilot is built specifically for pull requests — and for your workflow.\n\nWith ChatGPT, you have to copy/paste file diffs, structure prompts, enforce a template, regenerate for consistency, then paste the result back into GitHub.\n\nPRilot handles all of that automatically. It fetches diffs, filters noise, applies a standardized structure, and generates a consistent, high-quality PR — ready to send in seconds.",
			},
			{
				question: "Why use PRilot instead of GitHub Copilot?",
				answer:
					"Copilot can suggest a PR description, but it isn't optimized for structured, standardized output.\n\nPRilot is purpose-built for pull requests. It generates consistent, high-quality descriptions, filters noisy diffs, and gives you more control over the final result.\n\nIt's also more cost-effective for teams — instead of paying for a Copilot seat per developer, PRilot covers the whole team at a lower price point.",
			},
			{
				question: "What programming languages are supported?",
				answer:
					"PRilot works with any programming language — it analyzes git diffs, not frameworks. Whether you're working with JavaScript, Python, Go, Rust, Java, or any other language, PRilot can understand your changes.",
			},
			{
				question: "In which languages can Pull Requests be generated?",
				answer:
					"Pull Request descriptions can be generated in:\n• English\n• French\n• Spanish\n• German\n• Italian\n• Portuguese",
			},
		],
	},
	{
		id: "security",
		name: "Security & Privacy",
		faqs: [
			{
				question: "Is my code stored?",
				answer:
					"No. Your diffs are processed securely and are not stored permanently. PRilot does not train models on your private code.",
			},
			{
				question: "Can I use this with private repositories?",
				answer:
					"Yes. PRilot works with private repositories and only processes the diff necessary to generate your Pull Request description.",
			},
			{
				question: "What access does PRilot have to my repository?",
				answer:
					"PRilot only requests:\n• Read access to repository metadata and commits\n• Write access to Pull Requests only\n\nIt does not have merge permissions and cannot modify your codebase. Ever.",
			},
		],
	},
	{
		id: "workflow",
		name: "Workflow & Practical Use",
		faqs: [
			{
				question: "Does PRilot create the PR automatically?",
				answer:
					"You can generate a Pull Request and send it directly to your provider (GitHub, GitLab soon) — or copy/paste it manually if you prefer.",
			},
			{
				question: "Can I edit the generated Pull Request?",
				answer:
					"Absolutely. You can fully edit the generated Pull Request before publishing. PRilot gives you a strong first draft — you stay in control.",
			},
			{
				question: "Does it support custom PR templates?",
				answer:
					"PRilot follows a clean, structured format by default (Description, Changes, How to Test). Custom templates and team standards are coming soon.",
			},
			{
				question: "Can it handle refactors?",
				answer:
					"Yes. PRilot detects file renames, deletions, and structural changes and describes them clearly.",
			},
			{
				question: "Who is this for?",
				answer:
					"PRilot is for solo developers and teams who want to speed up their PR workflow while improving quality and standardization.",
			},
			{
				question: "How long does it take to generate a PR?",
				answer:
					"From fetching file diffs to having your Pull Request ready — just a few seconds.",
			},
		],
	},
	{
		id: "pricing",
		name: "Pricing & Usage",
		faqs: [
			{
				question: "Is there a free tier?",
				answer:
					"Yes. The free plan allows up to 30 Pull Requests per month. Paid plans unlock higher limits and advanced features.",
			},
			{
				question: "Why should I pay for this?",
				answer:
					"If writing PR descriptions takes 10–15 minutes each, and you open dozens per month, that's hours saved. PRilot pays for itself in time saved and improved review quality.",
			},
		],
	},
];
