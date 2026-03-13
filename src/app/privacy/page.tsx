import AdaptiveNavbar from "@/components/navbar/AdaptiveNavbar";

export const metadata = {
	title: "Privacy Policy",
	description: "Learn how PRilot collects, uses, and protects your data.",
	alternates: {
		canonical: "/privacy",
	},
};

export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
			<AdaptiveNavbar />
			<main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
				<h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
					Privacy Policy
				</h1>
				<p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
					Last updated: February 24, 2026
				</p>

				<div className="space-y-10 text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed">
					{/* 1 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							1. Introduction
						</h2>
						<p>
							PRilot is an AI-powered tool that automates pull request creation
							by analyzing commit history and code diffs. This Privacy Policy
							describes what data we collect, how we use it, and your rights
							regarding that data. By using PRilot you agree to the practices
							described below.
						</p>
					</section>

					{/* 2 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							2. Data We Collect
						</h2>
						<p className="mb-3">
							We collect only the data necessary to provide the service:
						</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>
								<span className="font-medium text-gray-900 dark:text-white">
									Account data:
								</span>{" "}
								Email address, username, and password (stored as a secure hash)
								when registering with email and password.
							</li>
							<li>
								<span className="font-medium text-gray-900 dark:text-white">
									GitHub profile data:
								</span>{" "}
								When signing in with GitHub OAuth, we receive your GitHub user
								ID and verified email address.
							</li>
							<li>
								<span className="font-medium text-gray-900 dark:text-white">
									Repository metadata:
								</span>{" "}
								Repository name, owner, visibility (public/private), and default
								branch — used solely to identify repositories linked to your
								account.
							</li>
							<li>
								<span className="font-medium text-gray-900 dark:text-white">
									Generated PR data:
								</span>{" "}
								The title, description, and branch information of pull requests
								generated within PRilot, stored so you can review and edit them
								before submitting.
							</li>
						</ul>
					</section>

					{/* 3 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							3. What We Do Not Store
						</h2>
						<p className="mb-3 font-semibold text-gray-900 dark:text-white">
							PRilot never stores your source code.
						</p>
						<p>
							When generating a pull request, we fetch commit messages and file
							diffs from the GitHub API on your behalf. This data is used
							transiently — processed by our AI to produce a PR description —
							and is never written to our database. It may be briefly cached in
							Redis for performance purposes and expires automatically. No code
							is retained after the generation request completes.
						</p>
					</section>

					{/* 4 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							4. GitHub Permissions We Request
						</h2>
						<p className="mb-4">
							PRilot requests the following GitHub permissions to function:
						</p>

						<div className="space-y-3">
							<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
								<p className="font-semibold text-gray-900 dark:text-white mb-2">
									OAuth scopes (read-only)
								</p>
								<ul className="space-y-1 text-sm">
									<li>
										<code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
											read:user
										</code>{" "}
										— Read your GitHub username and public profile.
									</li>
									<li>
										<code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
											user:email
										</code>{" "}
										— Read your verified GitHub email address for account
										creation.
									</li>
								</ul>
							</div>

							<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
								<p className="font-semibold text-gray-900 dark:text-white mb-2">
									GitHub App permissions
								</p>
								<ul className="space-y-1 text-sm">
									<li>
										<span className="font-medium text-gray-900 dark:text-white">
											Contents (read):
										</span>{" "}
										Access commits and file diffs between branches in order to
										generate PR descriptions.
									</li>
									<li>
										<span className="font-medium text-gray-900 dark:text-white">
											Pull requests (write):
										</span>{" "}
										Submit the generated pull request to your repository on your
										behalf.
									</li>
								</ul>
							</div>
						</div>

						<p className="mt-4 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-3">
							<span className="font-semibold">Important:</span> PRilot cannot
							modify your source code, push commits, delete branches, or merge
							pull requests. Its write access is strictly limited to creating
							pull requests on your behalf.
						</p>
					</section>

					{/* 5 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							5. How We Use Your Data
						</h2>
						<ul className="list-disc pl-6 space-y-2">
							<li>To create and manage your PRilot account.</li>
							<li>
								To authenticate you via GitHub OAuth or email and password.
							</li>
							<li>
								To link your GitHub repositories and generate pull requests.
							</li>
							<li>
								To send transactional email notifications (invitations, team
								updates, password resets) via Resend.
							</li>
							<li>To enforce per-user usage limits and prevent abuse.</li>
						</ul>
					</section>

					{/* 6 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							6. Third-Party Services
						</h2>
						<p className="mb-4">
							We rely on the following third-party providers to deliver PRilot.
							Each provider has its own privacy policy:
						</p>

						<div className="space-y-3">
							<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
								<p className="font-semibold text-gray-900 dark:text-white">
									Groq AI
								</p>
								<p className="text-sm mt-1">
									Our AI inference provider. Commit messages and code diffs are
									transmitted to Groq solely to generate PR titles and
									descriptions. Groq does not retain your data beyond the
									inference request.
								</p>
							</div>

							<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
								<p className="font-semibold text-gray-900 dark:text-white">
									GitHub
								</p>
								<p className="text-sm mt-1">
									Repository access and OAuth provider. We interact with the
									GitHub API under the permissions you explicitly grant when
									installing the PRilot GitHub App.
								</p>
							</div>

							<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
								<p className="font-semibold text-gray-900 dark:text-white">
									Resend
								</p>
								<p className="text-sm mt-1">
									Email delivery service used to send invitations, team
									notifications, and password reset emails. Only the recipient
									address and email body are transmitted.
								</p>
							</div>

							<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
								<p className="font-semibold text-gray-900 dark:text-white">
									Upstash (Redis)
								</p>
								<p className="text-sm mt-1">
									In-memory cache and rate-limiting layer. Used to temporarily
									cache GitHub API responses (commits, diffs) and enforce usage
									quotas. Cached data expires automatically.
								</p>
							</div>
						</div>
					</section>

					{/* 7 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							7. Data Retention
						</h2>
						<p>
							Account data is retained as long as your account is active. You
							may request deletion of your account at any time, after which your
							personal data will be removed from our systems. Generated PR
							records are tied to your account and can be deleted individually.
							Authentication tokens expire automatically according to their
							configured lifetime.
						</p>
					</section>

					{/* 8 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							8. Security
						</h2>
						<p>
							Passwords are hashed and are never stored in plaintext. Sessions
							use short-lived JWT access tokens paired with longer-lived refresh
							tokens. All communication between your browser and PRilot is
							encrypted over HTTPS.
						</p>
					</section>

					{/* 9 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							9. Changes to This Policy
						</h2>
						<p>
							We may update this Privacy Policy from time to time. When we do,
							we will revise the "Last updated" date at the top of this page.
							Continued use of PRilot after changes constitutes acceptance of
							the updated policy.
						</p>
					</section>

					{/* 10 */}
					<section>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
							10. Contact
						</h2>
						<p>
							If you have questions about this Privacy Policy or your data,
							please open an issue in the PRilot repository or contact us
							through the project's official channels.
						</p>
					</section>
				</div>
			</main>
		</div>
	);
}
