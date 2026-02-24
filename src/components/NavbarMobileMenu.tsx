"use client";

import { AnimatePresence } from "framer-motion";
import {
	BookOpen,
	CirclePlus,
	Folder,
	Github,
	Gitlab,
	Home,
	Scale,
	Settings,
	ShieldCheck,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { useInstallations } from "@/contexts/InstallationContext";
import { useRepos } from "@/contexts/ReposContext";
import { config } from "@/lib/client/config";
import firstCharUpperCase from "@/lib/utils/firstCharUpperCase";
import { useCreditsStore } from "@/stores/creditsStore";
import type { IInvitation } from "@/types/repos";
import AnimatedSlide from "./animations/AnimatedSlide";
import GithubAppButton from "./GithubAppButton";
import LogoutButton from "./LogoutButton";
import ThemeSwitcher from "./ThemeSwitcher";

interface NavbarMobileMenuProps {
	isOpen: boolean;
	onClose: () => void;
	onInvitationSelect: (inv: IInvitation) => void;
}

export default function NavbarMobileMenu({
	isOpen,
	onClose,
	onInvitationSelect,
}: NavbarMobileMenuProps) {
	const pathname = usePathname();
	const { installations } = useInstallations();
	const { repositories, invitations } = useRepos();
	const { remaining: creditsRemaining, total: creditsTotal, loading: creditsLoading, fetchCredits } =
		useCreditsStore();

	// Fetch credits when menu opens
	useEffect(() => {
		if (!isOpen) return;
		fetchCredits();
	}, [isOpen, fetchCredits]);

	const githubInstall = installations.find((i) => i.provider === "github");
	const gitlabInstall = installations.find((i) => i.provider === "gitlab");

	const githubOwned = repositories.filter(
		(r) => r.provider === "github" && r.userRole === "owner",
	);
	const gitlabOwned = repositories.filter(
		(r) => r.provider === "gitlab" && r.userRole === "owner",
	);
	const githubMemberRepos = repositories.filter(
		(r) => r.provider === "github" && r.userRole === "member",
	);
	const gitlabMemberRepos = repositories.filter(
		(r) => r.provider === "gitlab" && r.userRole === "member",
	);
	const githubPendingInvites = invitations.filter(
		(i) => i.repositoryProvider === "github",
	);
	const gitlabPendingInvites = invitations.filter(
		(i) => i.repositoryProvider === "gitlab",
	);

	const renderRepoList = (
		provider: "github" | "gitlab",
		install: boolean,
		owned: typeof repositories,
		memberRepos: typeof repositories,
		pendingInvites: typeof invitations,
	) => (
		<div className="py-2 min-w-56 max-h-80 overflow-y-auto hide-scrollbar">
			{!install && provider === "github" && (
				<div className="px-3 py-2">
					<GithubAppButton
						appName={config.github.appName}
						redirectUri={`${config.frontendUrl}/github/callback`}
					/>
				</div>
			)}
			{!install && provider === "gitlab" && (
				<div className="px-3 py-2">
					<button
						type="button"
						onClick={() => toast.info("GitLab integration isn't available yet.")}
						className="flex items-center gap-2 text-blue-700 dark:text-blue-400 cursor-pointer hover:underline text-sm"
					>
						<CirclePlus size={14} /> Connect GitLab
					</button>
				</div>
			)}

			{install && owned.length === 0 && memberRepos.length === 0 && (
				<p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
					Connected, but no repos found
				</p>
			)}

			{owned.length > 0 && (
				<>
					<p className="px-3 pt-1 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
						Owned
					</p>
					{owned.map((repo) => (
						<Link
							key={repo.id}
							href={`/dashboard/repo/${repo.id}`}
							onClick={onClose}
							className={`flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors ${
								pathname.includes(repo.id)
									? "text-blue-600 dark:text-blue-400"
									: "text-gray-800 dark:text-gray-200"
							}`}
						>
							<Folder size={14} />
							{firstCharUpperCase(repo.name)}
						</Link>
					))}
				</>
			)}

			{(memberRepos.length > 0 || pendingInvites.length > 0) && (
				<>
					<p className="px-3 pt-2 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
						Invited
					</p>
					{memberRepos.map((repo) => (
						<Link
							key={repo.id}
							href={`/dashboard/repo/${repo.id}`}
							onClick={onClose}
							className={`flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-md ${
								pathname.includes(repo.id)
									? "text-blue-600 dark:text-blue-400"
									: "text-gray-800 dark:text-gray-200"
							}`}
						>
							<Folder size={14} />
							{firstCharUpperCase(repo.name)}
						</Link>
					))}
					{pendingInvites.map((inv) => (
						<button
							key={inv.id}
							type="button"
							onClick={() => {
								onClose();
								onInvitationSelect(inv);
							}}
							className="flex items-center gap-2 w-full pl-6 pr-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
						>
							<Folder size={14} />
							⚠️ {firstCharUpperCase(inv.repositoryName)}
						</button>
					))}
				</>
			)}
		</div>
	);

	return (
		<AnimatePresence>
			{isOpen && (
				<AnimatedSlide
					key="mobile-menu"
					x={400}
					damping={14}
					mass={0.7}
					className="md:hidden fixed right-0 top-16 bottom-0 w-full bg-white dark:bg-zinc-950 z-40 overflow-y-auto"
				>
					<div className="flex flex-col gap-6 px-4 py-8 min-h-full">
						<Link
							href="/dashboard"
							onClick={onClose}
							className={`flex items-center gap-4 py-4 rounded-lg text-lg font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
								pathname === "/dashboard"
									? "text-blue-600 dark:text-blue-400"
									: "text-gray-600 dark:text-gray-400"
							}`}
						>
							<Home size={24} />
							Dashboard
						</Link>

						{/* GitHub section */}
						<div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-800">
							<p className="flex items-center gap-3 py-2 text-base font-semibold text-gray-800 dark:text-gray-200">
								<Github size={20} />
								GitHub
							</p>
							{renderRepoList(
								"github",
								!!githubInstall,
								githubOwned,
								githubMemberRepos,
								githubPendingInvites,
							)}
						</div>

						{/* GitLab section */}
						<div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-800">
							<p className="flex items-center gap-3 py-2 text-base font-semibold text-gray-800 dark:text-gray-200">
								<Gitlab size={20} />
								GitLab
							</p>
							{renderRepoList(
								"gitlab",
								!!gitlabInstall,
								gitlabOwned,
								gitlabMemberRepos,
								gitlabPendingInvites,
							)}
						</div>

						{/* Account section */}
						<div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-1">
							<p className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
								Account
							</p>

							<Link
								href="/dashboard/settings"
								onClick={onClose}
								className={`flex items-center gap-4 px-2 py-3 rounded-lg text-base font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
									pathname === "/dashboard/settings"
										? "text-blue-600 dark:text-blue-400"
										: "text-gray-600 dark:text-gray-400"
								}`}
							>
								<Settings size={20} />
								Settings
							</Link>

							<div className="flex items-center gap-4 px-2 py-3 text-base font-medium text-gray-600 dark:text-gray-400">
								<Zap size={20} className="text-yellow-500 shrink-0" />
								<span className="flex-1">Credits left</span>
								{creditsLoading ? (
									<span className="text-sm text-gray-400">…</span>
								) : (
									<span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
										{creditsRemaining !== null
											? `${creditsRemaining} / ${creditsTotal}`
											: "—"}
									</span>
								)}
							</div>

							<div className="flex items-center justify-between px-2 py-3">
								<span className="text-base font-medium text-gray-600 dark:text-gray-400">
									Theme
								</span>
								<ThemeSwitcher
									size={20}
									className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
								/>
							</div>

							<Link
								href="/docs"
								onClick={onClose}
								className="flex items-center gap-4 px-2 py-3 rounded-lg text-base font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
							>
								<BookOpen size={20} />
								Documentation
							</Link>

							<Link
								href="/privacy"
								onClick={onClose}
								className="flex items-center gap-4 px-2 py-3 rounded-lg text-base font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
							>
								<ShieldCheck size={20} />
								Privacy Policy
							</Link>

							<Link
								href="/terms"
								onClick={onClose}
								className="flex items-center gap-4 px-2 py-3 rounded-lg text-base font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
							>
								<Scale size={20} />
								Terms of Service
							</Link>

							<div className="flex items-center mx-auto pt-4 mt-2">
								<LogoutButton variant="icon" size={20} showText />
							</div>
						</div>
					</div>
				</AnimatedSlide>
			)}
		</AnimatePresence>
	);
}
