"use client";

import {
	ChevronLeft,
	ChevronRight,
	Clock,
	Filter,
	GitBranch,
	GitPullRequest,
	Plus,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import AnimatedOpacity from "@/components/animations/AnimatedOpacity";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import { Button } from "@/components/buttons/Button";
import { ConfirmDeletePRModal } from "@/components/modals/ConfirmDeletePRModal";
import { DeleteRepoModal } from "@/components/modals/DeleteRepoModal";
import { LeaveRepoModal } from "@/components/modals/LeaveRepoModal";
import { PRFilterModal } from "@/components/modals/PRFilterModal";
import RepoSkeleton from "@/components/skeletons/RepoSkeleton";
import { Badge } from "@/components/ui/Badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	StatCard,
} from "@/components/ui/Card";
import { PRListItem } from "@/components/ui/ListItem";
import { RepoAccessWarning } from "@/components/ui/RepoAccessWarning";
import { useRepos } from "@/contexts/ReposContext";
import { useFetchPRs } from "@/hooks/useFetchPRs";
import { usePullRequestActions } from "@/hooks/usePullRequestActions";
import { useRepository } from "@/hooks/useRepository";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import firstCharUpperCase from "@/lib/utils/firstCharUpperCase";
import { useRepoStore } from "@/stores/repoStore";

export default function RepositoryPage() {
	const params = useParams();
	const id = params.id;
	const repoId = id as string;

	const router = useRouter();
	const { repo, loading } = useRepository(repoId);
	const { refreshData } = useRepos();
	const removeRepo = useRepoStore((s) => s.removeRepo);

	const {
		pullRequests,
		loading: prLoading,
		pagination,
		loadNextPage,
		loadPrevPage,
		filter,
		setFilter,
	} = useFetchPRs({
		repoId: id as string,
		initialPage: 1,
		perPage: 10,
	});
	const { deleteDraftPR } = usePullRequestActions(repoId);

	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [prToDelete, setPrToDelete] = useState<string | null>(null);
	const [isDeleteRepoOpen, setIsDeleteRepoOpen] = useState(false);
	const [isLeaveRepoOpen, setIsLeaveRepoOpen] = useState(false);
	const [repoActionLoading, setRepoActionLoading] = useState(false);

	const draftPRs = repo?.draftPrCount ?? 0;
	const sentPRs = repo?.sentPrCount ?? 0;

	// Precompute an array of unique keys to decide how many PR skeleton to render
	const skeletonCount = Math.min(draftPRs + sentPRs, 5) || 1; // show at least 1 skeleton
	const skeletonKeys = useMemo(() => {
		return Array.from({ length: skeletonCount }, (_, i) => `skeleton-${i}`);
	}, [skeletonCount]);

	const handleDeleteRepo = async () => {
		try {
			setRepoActionLoading(true);
			const res = await fetchWithAuth(`/api/repos/${repoId}`, { method: "DELETE" });
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to delete repository");
			}
			removeRepo(repoId);
			await refreshData();
			router.replace("/dashboard");
			toast.success("Repository deleted successfully");
		} catch (err) {
			console.error(err);
			toast.error("Failed to delete repository");
		} finally {
			setRepoActionLoading(false);
			setIsDeleteRepoOpen(false);
		}
	};

	const handleLeaveRepo = async () => {
		try {
			setRepoActionLoading(true);
			const res = await fetchWithAuth(`/api/repos/${repoId}/members`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to leave repository");
			removeRepo(repoId);
			await refreshData();
			router.replace("/dashboard");
			toast.success("You left the repository");
		} catch (err) {
			console.error(err);
			toast.error("Failed to leave repository");
		} finally {
			setRepoActionLoading(false);
			setIsLeaveRepoOpen(false);
		}
	};

	if (loading) return <RepoSkeleton />;
	if (!repo) return null;

	return (
		<>
			<div className="p-6 flex flex-col gap-6 fade-in-fast">
				{/* ---- Repository Header ---- */}
				<div className="flex flex-col md:flex-row items-start justify-between">
					<AnimatedSlide x={-20} triggerOnView={false}>
						<div className="flex items-center gap-3 mb-2">
							<h1 className="text-3xl text-gray-900 dark:text-white">
								{firstCharUpperCase(repo.name)}
							</h1>
							<Badge>{repo.provider}</Badge>
						</div>
						{repo.isAccessible && (
							<p className="text-gray-600 dark:text-gray-400">
								{repo.commitsCount} commits on default branch{" "}
								<span className="font-mono">({repo.defaultBranch})</span>
							</p>
						)}
					</AnimatedSlide>

					{/* ---- Members and Generate a PR buttons ---- */}
					<AnimatedSlide
						x={20}
						triggerOnView={false}
						className="grid grid-cols-2 md:flex gap-3 mt-4 md:mt-0 w-full md:w-fit"
					>
						<Link href={`/dashboard/repo/${id}/members`} className="w-full">
							<Button className="w-full md:w-28 bg-gray-200 dark:bg-gray-900 shadow-md border border-gray-300 dark:border-gray-800 hover:bg-gray-300 hover:dark:bg-gray-700">
								<Users className="w-4 h-4 mr-2" />
								Members
							</Button>
						</Link>
						{repo.isAccessible ? (
							<Link href={`/dashboard/repo/${id}/pr/new`} className="w-full">
								<Button className="w-full md:w-30 bg-gray-900 text-white shadow-md dark:bg-gray-200 dark:text-black hover:bg-gray-700 hover:dark:bg-gray-400 group">
									<Plus className="w-4 h-4 mr-2 group-hover:rotate-90 duration-250" />
									Generate PR
								</Button>
							</Link>
						) : (
							<Button
								disabled
								className="w-full px-2 flex bg-gray-900 text-white shadow-md dark:bg-gray-200 dark:text-black opacity-50 cursor-not-allowed"
							>
								<Plus className="w-4 h-4 mr-2" />
								Generate PR
							</Button>
						)}
					</AnimatedSlide>
				</div>

				{!repo.isAccessible ? (
					/* ---- Access Lost Warning ---- */
					<RepoAccessWarning
						userRole={repo.userRole}
						onDeleteRepo={() => setIsDeleteRepoOpen(true)}
						onLeaveRepo={() => setIsLeaveRepoOpen(true)}
					/>
				) : (
					<>
						{/* ---- Stats Cards ---- */}
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<StatCard
								title="PRs Sent With PRilot"
								value={sentPRs}
								icon={GitPullRequest}
							/>
							<StatCard title="Draft PRs" value={draftPRs} icon={Clock} />
							<StatCard
								title="Active Branches"
								value={repo.branches.length}
								icon={GitBranch}
							/>
							<StatCard
								title="Members"
								value={repo.membersCount ?? 1}
								icon={Users}
							/>
						</div>

						{/* ---- Pull Requests List ---- */}
						<AnimatedSlide y={20} triggerOnView={false}>
							<Card>
								<CardHeader className="flex justify-between">
									<div>
										<CardTitle>Recent Pull Requests</CardTitle>
										<CardDescription>View and manage your PRs</CardDescription>
									</div>
									{/* ---- Open filter modal button ---- */}
									<Button
										size="sm"
										onClick={() => setIsFilterOpen(true)}
										className="w-fit px-4 flex flex-col md:flex-row items-center bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 shadow-sm hover:bg-gray-200 hover:dark:bg-gray-800 transition-colors"
									>
										<span className="flex gap-2 items-center">
											<Filter className="w-4 h-4" />
											Filter
										</span>
										<span className="hidden md:block mx-1">•</span>
										<span className="hidden md:block">
											{firstCharUpperCase(filter)} PRs
										</span>
									</Button>
								</CardHeader>
								{/* ---- Pull Requests items ---- */}
								<CardContent>
									<div className="space-y-3">
										{prLoading ? (
											<AnimatedOpacity delay={0.15} className="space-y-3">
												{skeletonKeys.map((key) => (
													<div
														key={key}
														className="block h-22 p-4 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse"
													></div>
												))}
											</AnimatedOpacity>
										) : pullRequests.length > 0 ? (
											pullRequests.map((pr) => (
												<PRListItem
													key={pr.id}
													href={
														pr.providerPrUrl ??
														`/dashboard/repo/${id}/pr/edit/${pr.id}`
													}
													title={pr.title}
													status={pr.status}
													compareBranch={pr.compareBranch}
													baseBranch={pr.baseBranch}
													updatedAt={pr.updatedAt}
													onDelete={() => setPrToDelete(pr.id)}
													provider={repo.provider}
												/>
											))
										) : (
											<div className="flex flex-col pl-4 text-lg pt-4 gap-2">
												{/* -- No Prs found fallback -- */}
												<span className="text-gray-600 dark:text-gray-400">
													No PRs available yet...
												</span>
												<Link
													className="text-blue-600 dark:text-blue-400 group w-fit"
													href={`/dashboard/repo/${id}/pr/new`}
												>
													👉{" "}
													<span className="group-hover:underline underline-offset-2 pl-1">
														Create one
													</span>
												</Link>
											</div>
										)}
									</div>
									{/* ---- Pagination Controls ---- */}
									{pagination.totalPages > 1 && (
										<div className="flex justify-center gap-2 mt-4">
											<Button
												disabled={pagination.page === 1}
												onClick={loadPrevPage}
												className="hover:bg-gray-200 hover:dark:bg-gray-600 w-fit px-2"
											>
												<ChevronLeft />
											</Button>
											<span className="flex items-center px-2 text-gray-700 dark:text-gray-300">
												Page {pagination.page} / {pagination.totalPages}
											</span>
											<Button
												disabled={pagination.page === pagination.totalPages}
												onClick={loadNextPage}
												className="hover:bg-gray-200 hover:dark:bg-gray-600 w-fit px-2"
											>
												<ChevronRight />
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</AnimatedSlide>

						{/* ---- PR filter modal ---- */}
						<PRFilterModal
							isOpen={isFilterOpen}
							value={filter}
							onClose={() => setIsFilterOpen(false)}
							onSelect={(value) => {
								setFilter(value);
								setIsFilterOpen(false);
							}}
						/>

						{/* ---- Delete PR modal ---- */}
						<ConfirmDeletePRModal
							isOpen={Boolean(prToDelete)}
							onClose={() => setPrToDelete(null)}
							onConfirm={() => {
								if (!prToDelete) return;
								deleteDraftPR(prToDelete);
								setPrToDelete(null);
							}}
						/>
					</>
				)}
			</div>

			{/* ---- Delete repo modal ---- */}
			<DeleteRepoModal
				isOpen={isDeleteRepoOpen}
				repoName={repo.name}
				onClose={() => setIsDeleteRepoOpen(false)}
				onConfirm={handleDeleteRepo}
				disabled={repoActionLoading}
			/>

			{/* ---- Leave repo modal ---- */}
			<LeaveRepoModal
				isOpen={isLeaveRepoOpen}
				repoName={repo.name}
				onClose={() => setIsLeaveRepoOpen(false)}
				onConfirm={handleLeaveRepo}
				disabled={repoActionLoading}
			/>
		</>
	);
}
