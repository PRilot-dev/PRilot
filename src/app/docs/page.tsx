import AdaptiveNavbar from "@/components/navbar/AdaptiveNavbar";
import DocsSidebar from "@/components/navbar/DocsSidebar";

export const metadata = {
	title: "Documentation – PRilot",
	description:
		"Learn how to connect GitHub, manage repositories, generate and send pull requests with PRilot.",
};

function Step({
	number,
	children,
}: { number: number; children: React.ReactNode }) {
	return (
		<div className="flex gap-3">
			<span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
				{number}
			</span>
			<p className="text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed">
				{children}
			</p>
		</div>
	);
}

function Note({ children }: { children: React.ReactNode }) {
	return (
		<div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
			<span className="font-semibold">Note: </span>
			{children}
		</div>
	);
}

function Warning({ children }: { children: React.ReactNode }) {
	return (
		<div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
			<span className="font-semibold">Important: </span>
			{children}
		</div>
	);
}

function SectionHeading({
	id,
	children,
}: { id: string; children: React.ReactNode }) {
	return (
		<h2
			id={id}
			className="text-2xl font-bold text-gray-900 dark:text-white mb-5 scroll-mt-24"
		>
			{children}
		</h2>
	);
}

export default function DocsPage() {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
			<AdaptiveNavbar />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
				{/* Page header */}
				<div className="mb-10">
					<h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
						Documentation
					</h1>
					<p className="text-gray-500 dark:text-gray-400">
						Everything you need to know to get up and running with PRilot.
					</p>
				</div>

				<div className="flex gap-10 items-start">
					<DocsSidebar />

					{/* Main content */}
					<main className="flex-1 min-w-0 space-y-16">
						{/* ── 1. Connect GitHub ── */}
						<section>
							<SectionHeading id="connect-github">
								Connecting a GitHub Account
							</SectionHeading>
							<p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed mb-6">
								Before you can generate pull requests, you need to install the
								PRilot GitHub App on your repositories. This gives PRilot
								read access to your commits and write access to create pull
								requests — nothing more.
							</p>

							<div className="space-y-3 mb-6">
								<Step number={1}>
									From your{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Dashboard
									</span>{" "}
									or the{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Settings
									</span>{" "}
									page, click{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Connect GitHub
									</span>
									. You will be redirected to GitHub to authorise the PRilot
									App.
								</Step>
								<Step number={2}>
									On GitHub, select which repositories (or all repositories) you
									want to grant PRilot access to, then click{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Install & Authorize
									</span>
									.
								</Step>
								<Step number={3}>
									GitHub redirects you back to PRilot. Your installation is
									registered automatically and your repositories appear in the
									sidebar under the GitHub dropdown.
								</Step>
							</div>

							<Note>
								You can expand PRilot's repository access at any time by visiting{" "}
								<span className="font-medium">Settings → GitHub</span> and
								clicking the{" "}
								<span className="font-medium">Manage on GitHub</span> button.
								To revoke access entirely, go to your{" "}
								<span className="font-medium">
									GitHub Settings → Applications → Installed Apps
								</span>{" "}
								and uninstall PRilot.
							</Note>
						</section>

						{/* ── 2. Invite Members ── */}
						<section>
							<SectionHeading id="invite-members">
								Inviting Members
							</SectionHeading>
							<p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed mb-6">
								Repository owners can invite collaborators so they can generate
								pull requests on a shared repository without needing their own
								GitHub App installation.
							</p>

							<div className="space-y-3 mb-6">
								<Step number={1}>
									Open the repository, then click{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Members
									</span>{" "}
									in the top navigation.
								</Step>
								<Step number={2}>
									Click{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Invite Member
									</span>
									, enter the person's email address, and click{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Send invite
									</span>
									.
								</Step>
								<Step number={3}>
									The invitee receives an email with a link to accept or decline
									the invitation. Until they respond, they appear in the member
									list with a{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Invited
									</span>{" "}
									badge.
								</Step>
								<Step number={4}>
									Once accepted, the invitee appears as a full{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Member
									</span>{" "}
									and can start generating PRs on the repository.
								</Step>
							</div>

							<Warning>
								When any member generates a PR on your repository, the credit is
								deducted from{" "}
								<span className="font-medium">
									the repository owner's quota
								</span>
								, not the member's. This prevents abuse through multiple
								accounts. As a repository owner, keep your credit usage in mind
								when inviting collaborators.
							</Warning>
						</section>

						{/* ── 3. Manage Members ── */}
						<section>
							<SectionHeading id="manage-members">
								Managing Members
							</SectionHeading>
							<p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed mb-6">
								The{" "}
								<span className="font-medium text-gray-900 dark:text-white">
									Members
								</span>{" "}
								page lets repository owners see everyone with access and remove
								them if needed.
							</p>

							<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 mb-6 text-sm">
								<div className="px-4 py-3 grid grid-cols-[80px_1fr] gap-3">
									<span className="font-semibold text-gray-900 dark:text-white">
										Owner
									</span>
									<span className="text-gray-600 dark:text-gray-400">
										Full access. Can invite and remove members. Cannot be
										removed.
									</span>
								</div>
								<div className="px-4 py-3 grid grid-cols-[80px_1fr] gap-3">
									<span className="font-semibold text-gray-900 dark:text-white">
										Member
									</span>
									<span className="text-gray-600 dark:text-gray-400">
										Can generate and manage PRs on the repository. Cannot invite
										or remove others.
									</span>
								</div>
								<div className="px-4 py-3 grid grid-cols-[80px_1fr] gap-3">
									<span className="font-semibold text-gray-900 dark:text-white">
										Invited
									</span>
									<span className="text-gray-600 dark:text-gray-400">
										Invitation sent but not yet accepted. Access is not granted
										until the invitation is accepted.
									</span>
								</div>
							</div>

							<p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed">
								To remove a member, click the{" "}
								<span className="font-medium text-gray-900 dark:text-white">
									Remove
								</span>{" "}
								button next to their name. Members can also leave a repository
								themselves at any time using the{" "}
								<span className="font-medium text-gray-900 dark:text-white">
									Leave
								</span>{" "}
								button visible from their own member view.
							</p>
						</section>

						{/* ── 4. Generate a PR ── */}
						<section>
							<SectionHeading id="generate-pr">
								Generating a Pull Request
							</SectionHeading>
							<p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed mb-6">
								PRilot reads the difference between two branches and uses AI to
								write a pull request title and description for you. Each
								generation uses one of your monthly credits.
							</p>

							<div className="space-y-3 mb-8">
								<Step number={1}>
									Navigate to a repository and click{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										New PR
									</span>
									.
								</Step>
								<Step number={2}>
									Select the{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Base branch
									</span>{" "}
									(the branch you want to merge{" "}
									<span className="italic">into</span>) and the{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Compare branch
									</span>{" "}
									(the branch containing your changes).
								</Step>
								<Step number={3}>
									Choose the{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										language
									</span>{" "}
									for the PR description (English, French, Spanish, German,
									Portuguese, or Italian).
								</Step>
								<Step number={4}>
									Pick a{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										generation mode
									</span>{" "}
									(see below), then click{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Generate with AI
									</span>
									.
								</Step>
								<Step number={5}>
									The title and description stream in live. Review them, edit if
									needed, and proceed to send.
								</Step>
							</div>

							{/* Mode cards */}
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
								Generation Modes
							</h3>
							<div className="grid sm:grid-cols-2 gap-4 mb-6">
								<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
									<div className="flex items-center gap-2 mb-2">
										<span className="text-base">⚡</span>
										<span className="font-semibold text-gray-900 dark:text-white">
											Fast
										</span>
									</div>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Generates the PR from{" "}
										<span className="font-medium text-gray-900 dark:text-white">
											commit messages only
										</span>
										. Quick and lightweight. Works best when your commits are
										descriptive and atomic.
									</p>
								</div>
								<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
									<div className="flex items-center gap-2 mb-2">
										<span className="text-base">🔍</span>
										<span className="font-semibold text-gray-900 dark:text-white">
											Deep
										</span>
									</div>
									<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
										Analyzes{" "}
										<span className="font-medium text-gray-900 dark:text-white">
											raw file diffs and commit messages
										</span>{" "}
										for a more detailed and accurate description. Limited to
										2000 lines changed.
									</p>
								</div>
							</div>

							<Note>
								Your remaining credits are shown in the user menu (top right).
								Credits reset monthly. You have{" "}
								<span className="font-medium">30 generations per month</span> per
								account.
							</Note>
						</section>

						{/* ── 5. Edit a PR ── */}
						<section>
							<SectionHeading id="edit-pr">Editing a PR</SectionHeading>
							<p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed mb-6">
								All generated PRs are saved as drafts that you can review and
								refine before sending.
							</p>

							<div className="space-y-3 mb-6">
								<Step number={1}>
									From the repository page or dashboard, click{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Edit
									</span>{" "}
									on any draft PR.
								</Step>
								<Step number={2}>
									Update the{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										title
									</span>{" "}
									and{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										description
									</span>{" "}
									as needed. The description field supports{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Markdown
									</span>
									.
								</Step>
								<Step number={3}>
									Toggle between{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Edit
									</span>{" "}
									and{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Preview
									</span>{" "}
									tabs to see how the Markdown will render on GitHub.
								</Step>
							</div>

							<Note>
								Changes are saved automatically. PRilot waits{" "}
								<span className="font-medium">1 second</span> after you stop
								typing before saving — you do not need to press any save button.
							</Note>
						</section>

						{/* ── 6. Send to GitHub ── */}
						<section>
							<SectionHeading id="send-pr">Sending a PR to GitHub</SectionHeading>
							<p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed mb-6">
								Once you are satisfied with the title and description, you can
								submit the pull request directly to GitHub from within PRilot.
							</p>

							<div className="space-y-3 mb-6">
								<Step number={1}>
									In the PR editor, click{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Send Pull Request
									</span>
									. The button is enabled only when both the title and
									description are filled in.
								</Step>
								<Step number={2}>
									PRilot calls the GitHub API on your behalf using your
									installation token and opens the pull request on GitHub.
								</Step>
								<Step number={3}>
									On success, a confirmation screen appears with a direct link
									to view the PR on GitHub. The PR status in PRilot changes to{" "}
									<span className="font-medium text-gray-900 dark:text-white">
										Sent
									</span>
									.
								</Step>
							</div>

							<Warning>
								PRilot only <span className="font-medium">creates</span> pull
								requests. It cannot merge, close, or modify them once submitted.
								All further actions must be taken directly in GitHub.
							</Warning>
						</section>

						{/* ── 7. Manage PRs ── */}
						<section>
							<SectionHeading id="manage-prs">Managing PRs</SectionHeading>
							<p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed mb-6">
								The repository page shows all pull requests generated with
								PRilot, with filters and pagination to help you stay organised.
							</p>

							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
								PR statuses
							</h3>
							<div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 mb-6 text-sm">
								<div className="px-4 py-3 grid grid-cols-[72px_1fr] gap-3">
									<span className="font-semibold text-gray-900 dark:text-white">
										Draft
									</span>
									<span className="text-gray-600 dark:text-gray-400">
										The PR has been generated and saved but not yet sent to
										GitHub. You can still edit or delete it.
									</span>
								</div>
								<div className="px-4 py-3 grid grid-cols-[72px_1fr] gap-3">
									<span className="font-semibold text-gray-900 dark:text-white">
										Sent
									</span>
									<span className="text-gray-600 dark:text-gray-400">
										The PR has been submitted to GitHub. You can follow the link
										to view it directly in your repository.
									</span>
								</div>
							</div>

							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
								Filtering and pagination
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed mb-4">
								Use the filter dropdown to show{" "}
								<span className="font-medium text-gray-900 dark:text-white">
									All PRs
								</span>
								,{" "}
								<span className="font-medium text-gray-900 dark:text-white">
									Draft PRs
								</span>
								, or{" "}
								<span className="font-medium text-gray-900 dark:text-white">
									Sent PRs
								</span>
								. Results are paginated at 10 per page.
							</p>

							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
								Deleting a draft
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed">
								Click{" "}
								<span className="font-medium text-gray-900 dark:text-white">
									Delete
								</span>{" "}
								next to any draft PR to remove it permanently. Sent PRs cannot
								be deleted from PRilot — they exist independently on GitHub
								once submitted.
							</p>
						</section>
					</main>
				</div>
			</div>
		</div>
	);
}
