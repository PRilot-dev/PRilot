"use client";

import {
	AlertCircle,
	CheckCircle,
	Clock,
	Github,
	GitPullRequest,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedOpacity from "@/components/animations/AnimatedOpacity";
import AnimatedScale from "@/components/animations/AnimatedScale";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	StatCard,
} from "@/components/Card";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import GithubAppButton from "@/components/GithubAppButton";
import {
	DashboardPRListItem,
	DashboardRepoListItem,
} from "@/components/ListItem";
import { useInstallations } from "@/contexts/InstallationContext";
import { useRepos } from "@/contexts/ReposContext";
import { usePrefetchRepos } from "@/hooks/usePrefetchRepos";
import { config } from "@/lib/client/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import firstCharUpperCase from "@/lib/utils/firstCharUpperCase";
import { formatDateTime } from "@/lib/utils/formatDateTime";
import { getPercentageChange } from "@/lib/utils/stats";
import type { IPullRequest } from "@/types/pullRequests";

interface IRecentPR extends IPullRequest {
	repoName: string;
	repoId: string;
	provider: string;
	providerPrUrl?: string;
}

interface IRecentPRsResponse {
	recentPRs: IRecentPR[];
	stats: {
		thisWeek: number;
		lastWeek: number;
	};
}

export default function DashboardPage() {
	const { installations } = useInstallations();
	const { repositories, invitations, loading: reposLoading } = useRepos();

	const hasGithub = installations.some((i) => i.provider === "github");
	const hasNoRepos =
		repositories.length === 0 && (invitations?.length ?? 0) === 0;
	const [recentPRs, setRecentPRs] = useState<IRecentPR[]>([]);
	const [weeklyStats, setWeeklyStats] = useState<{
		thisWeek: number;
		lastWeek: number;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const hasFetchedRef = useRef(false);

	// Check for pending invitations
	const pendingInvitations = invitations ?? [];

	// Fetch recent PRs (only once on mount)
	useEffect(() => {
		if (hasFetchedRef.current) return;
		hasFetchedRef.current = true;

		const fetchRecentPRs = async () => {
			try {
				const res = await fetchWithAuth("/api/pull-requests/recent");
				if (!res.ok) throw new Error("Failed to fetch recent PRs");

				const data: IRecentPRsResponse = await res.json();

				setRecentPRs(data.recentPRs);
				setWeeklyStats(data.stats);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchRecentPRs();
	}, []);

	// Compute top 3 repositories by total PRs count
	const topRepos = [...repositories]
		.sort(
			(a, b) =>
				b.draftPrCount + b.sentPrCount - (a.draftPrCount + a.sentPrCount),
		)
		.slice(0, 3);

	// Prefetch top repos into store so navigation is instant
	const topRepoIds = useMemo(() => topRepos.map((r) => r.id), [topRepos]);
	usePrefetchRepos(topRepoIds);

	// Compute total sent and draft PRs
	const totalDraftPrs = repositories.reduce(
		(sum, repo) => sum + repo.draftPrCount,
		0,
	);

	const totalSentPrs = repositories.reduce(
		(sum, repo) => sum + repo.sentPrCount,
		0,
	);

	// Compute comment message for progression stats card
	const weeklyComparisonLabel = (() => {
		if (!weeklyStats) return undefined;

		const { thisWeek, lastWeek } = weeklyStats;

		if (lastWeek === 0 && thisWeek > 0) {
			return "New activity this week";
		}

		if (lastWeek === 0 && thisWeek === 0) {
			return "No activity yet";
		}

		if (lastWeek > 0 && thisWeek === 0) {
			return "No activity this week";
		}

		if (lastWeek === thisWeek) {
			return "Same activity as last week";
		}

		const pct = Math.round(getPercentageChange(thisWeek, lastWeek));
		return `${pct > 0 ? "+" : ""}${pct}% vs last week`;
	})();

	if (reposLoading) return <DashboardSkeleton />;

	return (
		<div className="p-6 space-y-6 fade-in-fast">
			<AnimatedSlide x={-20} triggerOnView={false} className="mb-10">
				<h1 className="text-4xl mb-2 text-gray-900 dark:text-white">
					Dashboard
				</h1>
				<p className="text-xl text-gray-600 dark:text-gray-400">
					Overview of your repositories and recent activity
				</p>
			</AnimatedSlide>

			{/* ---- Pending Invitations Warning ---- */}
			{pendingInvitations.length > 0 && (
				<AnimatedScale scale={0.97} triggerOnView={false}>
					<div className="bg-orange-100 dark:bg-yellow-900/15 border border-orange-400/50 dark:border-yellow-800/40 rounded-lg p-4 flex items-start gap-3">
						<AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
						<div>
							<h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
								Pending Invitations
							</h3>
							<p className="text-sm text-amber-800 dark:text-amber-200">
								You have {pendingInvitations.length} pending invitation
								{pendingInvitations.length === 1 ? "" : "s"}. Check your navbar
								to accept or decline them.
							</p>
						</div>
					</div>
				</AnimatedScale>
			)}

			{hasNoRepos ? (
				/* ---- Empty state: no repos ---- */
				<AnimatedSlide y={20} triggerOnView={false}>
					<Card className="max-w-lg mx-auto">
						<CardContent className="flex flex-col items-center text-center py-12 px-6 space-y-6">
							<div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
								<Github className="w-10 h-10 text-gray-500 dark:text-gray-400" />
							</div>
							<div className="space-y-2">
								<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
									{hasGithub
										? "No repositories found"
										: "Connect your GitHub account"}
								</h2>
								<p className="text-gray-500 dark:text-gray-400">
									{hasGithub
										? "Your GitHub account is connected but no repositories were imported. Make sure you've granted access to at least one repository."
										: "Link your GitHub account to start generating pull requests."}
								</p>
							</div>
							<GithubAppButton
								appName={config.github.appName}
								className="items-center"
								redirectUri={`${config.frontendUrl}/github/callback`}
								label={hasGithub ? "Authorize repositories" : undefined}
							/>
						</CardContent>
					</Card>
				</AnimatedSlide>
			) : (
				<>
					{/* ---- Stats Cards ---- */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<StatCard
							title="Total Repositories"
							value={repositories.length}
							icon={GitPullRequest}
							comment="Connected to your accounts"
						/>
						<StatCard
							title="PRs Sent With PRilot"
							value={totalSentPrs}
							icon={Clock}
							comment="Across all repos"
						/>
						<StatCard
							title="Drafts"
							value={totalDraftPrs}
							icon={AlertCircle}
							comment="Pending review"
						/>
						<StatCard
							title="Sent This Week"
							value={weeklyStats?.thisWeek ?? 0}
							icon={CheckCircle}
							comment={weeklyComparisonLabel}
						/>
					</div>

					{/* ---- Recent Activity ---- */}
					<div className="grid gap-6 xl:grid-cols-2">
						{/* ---- Top repositories ---- */}
						<AnimatedSlide x={-20} y={-20} triggerOnView={false}>
							<Card className="flex flex-col h-full">
								<CardHeader>
									<CardTitle>Your Repositories</CardTitle>
									<CardDescription>
										Quick access to your most active repos
									</CardDescription>
								</CardHeader>
								<CardContent
									className={`flex flex-col space-y-4 h-full ${topRepos.length === 0 && "justify-center pt-8"}`}
								>
									{topRepos.length > 0 ? (
										topRepos.map((repo) => (
											<DashboardRepoListItem
												key={repo.id}
												repoId={repo.id}
												name={repo.name}
												provider={repo.provider}
												draftPrCount={repo.draftPrCount}
												sentPrCount={repo.sentPrCount}
											/>
										))
									) : (
										<p className="text-gray-500 text-lg text-center self-center my-4 md:mt-0 fade-in">
											No recent repository found
										</p>
									)}
								</CardContent>
							</Card>
						</AnimatedSlide>

						{/* ---- Recent PRs ---- */}
						<AnimatedSlide x={20} y={-20} triggerOnView={false}>
							<Card className="flex flex-col h-full">
								<CardHeader>
									<CardTitle>Recent Pull Requests</CardTitle>
									<CardDescription>Your latest PR activity</CardDescription>
								</CardHeader>
								<CardContent
									className={`flex flex-col space-y-4 h-full ${recentPRs.length === 0 && !loading && "justify-center pt-8"}`}
								>
									{loading ? (
										<AnimatedOpacity>
											{/* -- PRs loading skeleton */}
											<div className="h-18 w-full bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
											<div className="h-18 w-full bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
											<div className="h-18 w-full bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
										</AnimatedOpacity>
									) : recentPRs.length > 0 ? (
										recentPRs.map((pr) => (
											<DashboardPRListItem
												key={pr.id}
												title={pr.title}
												subtitle={`${firstCharUpperCase(pr.repoName)} • ${formatDateTime(pr.updatedAt)}`}
												badge={pr.provider}
												status={pr.status}
												providerUrl={pr.providerPrUrl}
												repoId={pr.repoId}
												prId={pr.id}
											/>
										))
									) : (
										<p className="text-gray-500 text-lg text-center self-center my-4 md:mt-0 fade-in">
											No recent PRs found
										</p>
									)}
								</CardContent>
							</Card>
						</AnimatedSlide>
					</div>
				</>
			)}
		</div>
	);
}
