import Link from "next/link";
import AdaptiveNavbar from "@/components/navbar/AdaptiveNavbar";

export const metadata = {
	title: "Terms of Service",
	description: "Read the terms and conditions governing your use of PRilot.",
	alternates: {
		canonical: "/terms",
	},
};

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
			<AdaptiveNavbar />
			<main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
				<h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
					Terms of Service
				</h1>
				<p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
					Last updated: February 24, 2026
				</p>

				<div className="space-y-10 text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed">
					{/* 1 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							1. Acceptance of Terms
						</h2>
						<p>
							By creating an account or using PRilot, you agree to be bound by
							these Terms of Service ("Terms"). If you do not agree, do not use
							PRilot. We reserve the right to update these Terms at any time;
							continued use after changes constitutes acceptance.
						</p>
					</section>

					{/* 2 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							2. What PRilot Does
						</h2>
						<p className="mb-3">
							PRilot is an AI-powered tool that reads commit messages and code
							diffs from your GitHub repositories and uses them to automatically
							draft pull request titles and descriptions. It then submits those
							pull requests to GitHub on your behalf.
						</p>
						<p>
							PRilot is a productivity aid. The AI-generated content is a
							starting point — you are responsible for reviewing, editing, and
							approving any pull request before it is submitted.
						</p>
					</section>

					{/* 3 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							3. What PRilot Cannot Do
						</h2>
						<p className="mb-4">
							PRilot's capabilities are intentionally narrow. By design:
						</p>
						<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-2 text-sm">
							<p className="flex items-start gap-2">
								<span className="text-red-500 font-bold mt-0.5">✕</span>
								<span>
									<span className="font-medium text-gray-900 dark:text-white">
										Cannot modify source code.
									</span>{" "}
									PRilot only reads your code — it never pushes commits or makes
									any changes to your repository's files.
								</span>
							</p>
							<p className="flex items-start gap-2">
								<span className="text-red-500 font-bold mt-0.5">✕</span>
								<span>
									<span className="font-medium text-gray-900 dark:text-white">
										Cannot merge pull requests.
									</span>{" "}
									PRilot can only create and submit pull requests. Merging is
									always a manual action performed by you or your team inside
									GitHub.
								</span>
							</p>
							<p className="flex items-start gap-2">
								<span className="text-red-500 font-bold mt-0.5">✕</span>
								<span>
									<span className="font-medium text-gray-900 dark:text-white">
										Cannot delete branches or repositories.
									</span>{" "}
									No destructive actions are possible through PRilot.
								</span>
							</p>
							<p className="flex items-start gap-2">
								<span className="text-red-500 font-bold mt-0.5">✕</span>
								<span>
									<span className="font-medium text-gray-900 dark:text-white">
										Cannot approve or review pull requests.
									</span>{" "}
									PRilot has no ability to review, approve, or interact with
									pull requests beyond creation.
								</span>
							</p>
						</div>
					</section>

					{/* 4 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							4. User Accounts
						</h2>
						<p className="mb-3">
							You are responsible for maintaining the confidentiality of your
							credentials. You must not share your account with others. You agree
							to notify us immediately if you suspect unauthorized access to your
							account.
						</p>
						<p>
							You must be at least 16 years old to use PRilot. By registering,
							you confirm that you meet this requirement.
						</p>
					</section>

					{/* 5 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							5. GitHub Integration & Permissions
						</h2>
						<p className="mb-3">
							Using PRilot requires you to authorize our GitHub App on the
							repositories you want to work with. By doing so, you grant PRilot
							the following permissions on those repositories:
						</p>
						<ul className="list-disc pl-6 space-y-2 text-sm">
							<li>
								<span className="font-medium text-gray-900 dark:text-white">
									Contents (read):
								</span>{" "}
								To fetch commit history and file diffs for PR generation.
							</li>
							<li>
								<span className="font-medium text-gray-900 dark:text-white">
									Pull requests (write):
								</span>{" "}
								To create and submit pull requests on your behalf.
							</li>
						</ul>
						<p className="mt-3">
							You can revoke access to PRilot at any time through your{" "}
							<a
								href="https://github.com/settings/installations"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 dark:text-blue-400 hover:underline"
							>
								GitHub App installations settings
							</a>
							.
						</p>
					</section>

					{/* 6 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							6. Usage Limits
						</h2>
						<p className="mb-3">
							To ensure fair usage, PRilot enforces the following limits:
						</p>
						<ul className="list-disc pl-6 space-y-2 text-sm">
							<li>
								<span className="font-medium text-gray-900 dark:text-white">
									Monthly limit:
								</span>{" "}
								Repository owners may generate up to 30 pull requests per
								repository per month. This limit resets automatically.
							</li>
							<li>
								<span className="font-medium text-gray-900 dark:text-white">
									Per-minute limit:
								</span>{" "}
								A rate limit applies to AI generation requests per user per
								minute to prevent abuse.
							</li>
						</ul>
						<p className="mt-3">
							We reserve the right to adjust these limits at any time. Attempting
							to circumvent usage limits may result in account suspension.
						</p>
					</section>

					{/* 7 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							7. AI-Generated Content
						</h2>
						<p className="mb-3">
							Pull request titles and descriptions are generated by Cerebras AI
							models. AI-generated content may be inaccurate, incomplete, or
							inappropriate for your specific context.
						</p>
						<p>
							You are solely responsible for reviewing all AI-generated content
							before submitting a pull request. PRilot makes no warranties
							regarding the accuracy, quality, or fitness of AI-generated
							outputs. Submitting a pull request is always a deliberate,
							user-initiated action.
						</p>
					</section>

					{/* 8 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							8. Acceptable Use
						</h2>
						<p className="mb-3">You agree not to use PRilot to:</p>
						<ul className="list-disc pl-6 space-y-2 text-sm">
							<li>
								Access repositories you do not have authorization to access.
							</li>
							<li>
								Attempt to reverse-engineer, scrape, or otherwise extract data
								from PRilot's systems.
							</li>
							<li>
								Use the service in a way that violates GitHub's Terms of Service
								or any applicable law.
							</li>
							<li>
								Automate usage in a manner intended to circumvent rate limits or
								quotas.
							</li>
						</ul>
					</section>

					{/* 9 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							9. Third-Party Services
						</h2>
						<p>
							PRilot integrates with GitHub, Cerebras AI, Resend, and Upstash.
							Your use of those services is subject to their respective terms and
							privacy policies. PRilot is not responsible for the availability,
							accuracy, or conduct of any third-party service.
						</p>
					</section>

					{/* 10 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							10. Disclaimer of Warranties
						</h2>
						<p>
							PRilot is provided "as is" and "as available" without warranties
							of any kind, express or implied. We do not warrant that the service
							will be uninterrupted, error-free, or that AI-generated content
							will be accurate or suitable for any particular purpose. Use PRilot
							at your own risk.
						</p>
					</section>

					{/* 11 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							11. Limitation of Liability
						</h2>
						<p>
							To the fullest extent permitted by applicable law, PRilot and its
							contributors shall not be liable for any indirect, incidental,
							special, consequential, or punitive damages arising from your use
							of the service, including but not limited to damages resulting from
							AI-generated pull request content, unauthorized access to your
							repositories, or service outages.
						</p>
					</section>

					{/* 12 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							12. Changes to These Terms
						</h2>
						<p>
							We may revise these Terms at any time. When we do, we will update
							the "Last updated" date above. Significant changes will be
							communicated through the application or by email where possible.
							Continued use of PRilot after changes constitutes acceptance of
							the revised Terms.
						</p>
					</section>

					{/* 13 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							13. Contact
						</h2>
						<p>
							For questions about these Terms, please open an issue in the PRilot
							repository or contact us through the project's official channels.
							You can also review our{" "}
							<Link
								href="/privacy"
								className="text-blue-600 dark:text-blue-400 hover:underline"
							>
								Privacy Policy
							</Link>{" "}
							for information about data handling.
						</p>
					</section>
				</div>
			</main>
		</div>
	);
}
