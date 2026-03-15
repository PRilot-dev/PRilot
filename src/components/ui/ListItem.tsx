"use client";

import { ArrowRight, Edit, GitPullRequest, Send, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import firstCharUpperCase from "@/lib/utils/firstCharUpperCase";
import { formatDateTime } from "@/lib/utils/formatDateTime";
import type { Member } from "@/types/members";
import AnimatedScale from "../animations/AnimatedScale";
import { Badge } from "./Badge";

// ------------------------------------
// ------ Dashboard PR List item ------
// ------------------------------------
type DashboardPRListItemProps = {
	title: string;
	subtitle: string;
	badge?: string;
	className?: string;
	status?: string;
	providerUrl?: string;
	repoId?: string;
	prId?: string;
};

export function DashboardPRListItem({
	title,
	subtitle,
	badge,
	className = "",
	status,
	providerUrl,
	repoId,
	prId,
}: DashboardPRListItemProps) {
	return (
		<AnimatedScale
			scale={0.9}
			triggerOnView={false}
			className={`flex items-center justify-between gap-6 h-18 p-3 rounded-lg
        border border-gray-200 dark:border-gray-700/70
        bg-gray-100/60 dark:bg-zinc-950/90
        ${className}`}
		>
			<div className="flex flex-col justify-between h-full w-0 flex-1">
				{/* -------- Title and badge -------- */}
				<div className="flex items-center gap-2">
					<p className="text-sm text-gray-900 dark:text-white truncate lg:max-w-xs">
						{title}
					</p>
					{badge && <Badge className="text-xs">{badge}</Badge>}
				</div>

				{/* -------- Subtitle -------- */}
				<p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
			</div>

			{/* -------- Status and action link -------- */}
			<div className="flex flex-col justify-between items-end h-full">
				{status && (
					<span className="flex items-center text-sm text-gray-700 dark:text-gray-400">
						{firstCharUpperCase(status)}
						{status === "draft" ? (
							<Edit size={16} className="inline-block ml-1" />
						) : (
							<Send size={16} className="inline-block ml-1 mt-0.5" />
						)}
					</span>
				)}
				{status === "draft" && (
					<Link
						href={`/dashboard/repo/${repoId}/pr/edit/${prId}`}
						prefetch={false}
						className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline self-end"
					>
						Edit
					</Link>
				)}
				{status === "sent" && (
					<Link
						href={providerUrl ?? "https://github.com"}
						target="blank"
						className="flex gap-2 items-center text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline self-end"
					>
						View on {providerUrl?.includes("gitlab") ? "GitLab" : "GitHub"}
					</Link>
				)}
			</div>
		</AnimatedScale>
	);
}

// -----------------------------------------
// ------ Dashboard Repo List item ---------
// -----------------------------------------
type DashboardRepoListItemProps = {
	repoId: string;
	name: string;
	provider: string;
	draftPrCount: number;
	sentPrCount: number;
};

export function DashboardRepoListItem({
	repoId,
	name,
	provider,
	draftPrCount,
	sentPrCount,
}: DashboardRepoListItemProps) {
	return (
		<AnimatedScale
			scale={0.9}
			triggerOnView={false}
			className="flex items-center justify-between gap-4 h-18 px-3 py-2 rounded-lg
				border border-gray-200 dark:border-gray-700/70
				bg-gray-100/60 dark:bg-zinc-950/90"
		>
			<div className="flex flex-col justify-between h-full w-0 flex-1 py-1">
				<div className="flex items-center gap-2">
					<Link
						href={`/dashboard/repo/${repoId}`}
						prefetch={false}
						className="text-sm text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
					>
						{firstCharUpperCase(name)}
					</Link>
					<Badge className="text-xs">{provider}</Badge>
				</div>
				<p className="text-xs text-gray-500 dark:text-gray-400">
					{draftPrCount} drafts • {sentPrCount} PRs sent
				</p>
			</div>
			<div className="flex flex-col items-end pt-0.5">
				<Link
					href={`/dashboard/repo/${repoId}`}
					prefetch={false}
					className="flex items-center gap-1.5 px-3 py-1 text-xs text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
				>
					Open repo
					<ArrowRight size={12} />
				</Link>
				<Link
					href={`/dashboard/repo/${repoId}/pr/new`}
					prefetch={false}
					className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
				>
					<Sparkles size={14} />
					New PR
				</Link>
			</div>
		</AnimatedScale>
	);
}

// ------------------------------
// -------- PR List Item --------
// ------------------------------
type PRListItemProps = {
	href: string;
	title: string;
	status: string;
	compareBranch: string;
	baseBranch: string;
	updatedAt: string;
	onDelete: () => void;
	provider: string;
};

export function PRListItem({
	href,
	title,
	status,
	compareBranch,
	baseBranch,
	updatedAt,
	onDelete,
	provider,
}: PRListItemProps) {
	return (
		<AnimatedScale
			scale={0.94}
			triggerOnView={false}
			className="flex flex-col lg:h-22 p-4 rounded-lg bg-gray-100/60 dark:bg-zinc-950/90
        border border-gray-200 dark:border-gray-700/70 fade-in"
		>
			<div className="flex flex-col lg:flex-row items-start justify-between h-full">
				<div className="h-full flex flex-col justify-between w-full lg:w-fit">
					{/* -------- Title and badge -------- */}
					<div className="w-full flex justify-between gap-3 mb-2">
						<p className="text-gray-900 dark:text-white">{title}</p>
						<Badge className="h-fit">{status}</Badge>
					</div>

					{/* -------- Branches -------- */}
					<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
						<GitPullRequest className="w-4 h-4" />
						<span className="font-mono text-xs truncate">{compareBranch}</span>
						<span>→</span>
						<span className="font-mono text-xs truncate">{baseBranch}</span>
					</div>
				</div>

				{/* -------- Created at and action link -------- */}
				<div className="flex lg:flex-col justify-between items-end h-full w-full lg:w-fit">
					{/* ---- Date and time (desktop) ---- */}
					<span className="text-sm text-gray-500 dark:text-gray-400 lg:block">
						{formatDateTime(updatedAt)}
					</span>
					<div className="flex items-center justify-between gap-4">
						{/* Delete PR draft button */}
						{status === "draft" && (
							<button
								type="button"
								onClick={onDelete}
								className="text-red-500 font-medium text-base cursor-pointer underline-offset-2 hover:underline"
							>
								Delete
							</button>
						)}
						{/* Edit / View PR button */}
						<Link
							href={href}
							prefetch={false}
							target={status === "sent" ? "_blank" : "_self"}
							className="block text-blue-600 dark:text-blue-400 font-medium underline-offset-2 hover:underline"
						>
							{status === "draft"
								? "Edit"
								: `View on ${provider === "gitlab" ? "GitLab" : "GitHub"}`}
						</Link>
					</div>
				</div>
			</div>
		</AnimatedScale>
	);
}

// ------------------------------
// ------ Member List Item ------
// ------------------------------
type MemberListItemProps = {
	member: Member;
	onDelete: (member: Member) => void;
	className?: string;
	showDeleteButton: boolean;
};

export function MemberListItem({
	member,
	onDelete,
	className = "",
	showDeleteButton,
}: MemberListItemProps) {
	return (
		<AnimatedScale
			scale={0.94}
			triggerOnView={false}
			className={`flex flex-col md:flex-row gap-4 justify-between min-h-20 p-4 rounded-lg bg-gray-100/60 dark:bg-zinc-950/90 border border-gray-200 dark:border-gray-700/70 ${className}`}
		>
			<div className="flex gap-4 items-center">
				{/* -------- Avatar -------- */}
				<div className="flex items-start justify-between">
					<span className="w-10 h-10 flex justify-center items-center rounded-full bg-blue-200 dark:bg-blue-900 text-sm font-semibold">
						{member.username?.slice(0, 1).toUpperCase() ||
							member.email.slice(0, 1).toUpperCase()}
					</span>
				</div>

				{/* -------- Name and email -------- */}
				<div className="flex flex-col h-full">
					<span>{member.username || member.email.split("@")[0]}</span>
					<span className="text-sm text-gray-600 dark:text-gray-400">
						{member.email}
					</span>
				</div>
			</div>

			{/* -------- Role select and delete button -------- */}
			<div className="flex gap-4 items-center justify-end md:justify-normal">
				<Badge>
					{member.role ? firstCharUpperCase(member.role) : "Invited"}
				</Badge>

				{/* ---- Delete button (only for member, not for owner) ---- */}
				{member.role !== "owner" && showDeleteButton && (
					<button
						type="button"
						onClick={() => onDelete(member)}
						className="hover:scale-105 hover:cursor-pointer transition-transform"
					>
						<Trash2 size={20} className="text-red-500" />
					</button>
				)}
			</div>
		</AnimatedScale>
	);
}
