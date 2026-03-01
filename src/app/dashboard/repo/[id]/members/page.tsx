"use client";

import { LogOut, UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import { Button } from "@/components/buttons/Button";
import { AddMemberModal } from "@/components/modals/AddMemberModal";
import { DeleteMemberModal } from "@/components/modals/DeleteMemberModal";
import { LeaveRepoModal } from "@/components/modals/LeaveRepoModal";
import MemberPageSkeleton from "@/components/skeletons/MemberPageSkeleton";
import { Badge } from "@/components/ui/Badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/Card";
import { MemberListItem } from "@/components/ui/ListItem";
import { useRepos } from "@/contexts/ReposContext";
import { useUser } from "@/contexts/UserContext";
import { useRepository } from "@/hooks/useRepository";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import firstCharUpperCase from "@/lib/utils/firstCharUpperCase";
import type { Member } from "@/types/members";

export default function RepositoryPage() {
	const params = useParams();
	const repoId = params.id as string;
	const router = useRouter();

	const { user } = useUser();
	const { repo, loading: repoLoading } = useRepository(repoId);
	const { refreshData } = useRepos();

	const [members, setMembers] = useState<Member[]>([]);
	const [loading, setLoading] = useState(true);
	const isUserAdmin = members.find((m) => m.id === user?.id)?.role === "owner";

	// Modal states
	const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
	const [isLeaveRepoModalOpen, setIsLeaveRepoModalOpen] = useState(false);
	const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
	const [memberDeleteLoading, setMemberDeleteLoading] = useState(false);

	// Fetch members from API
	useEffect(() => {
		async function fetchMembers() {
			setLoading(true);
			try {
				const res = await fetchWithAuth(`/api/repos/${repoId}/members`);

				if (!res.ok) throw new Error("Failed to fetch members");
				const data = await res.json();

				setMembers(
					data.members.map((m: Member) => ({
						...m,
						createdAt: new Date(m.createdAt),
					})),
				);
			} catch (err) {
				console.error(err);
				toast.error("Failed to load repository members");
			} finally {
				setLoading(false);
			}
		}

		fetchMembers();
	}, [repoId]);

	async function removeMember() {
		try {
			setMemberDeleteLoading(true);

			const res = await fetchWithAuth(`/api/repos/${repoId}/members`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: memberToDelete
					? JSON.stringify({ userId: memberToDelete.id })
					: undefined,
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || "Failed to remove member");
			}

			if (memberToDelete) {
				// Update local state
				setMembers((prev) =>
					memberToDelete
						? prev.filter((m) => m.id !== memberToDelete.id)
						: prev.filter((m) => m.id !== user?.id),
				);
				toast.success("Member removed successfully");
			} else {
				// If the current user left the repo, refresh global repos data
				await refreshData();
				router.replace("/dashboard");
				toast.success("You left the repository");
			}
		} catch (error) {
			console.error(error);
			toast.error(
				memberToDelete
					? "Failed to remove member"
					: "Failed to leave repository",
			);
		} finally {
			setMemberDeleteLoading(false);
			setMemberToDelete(null);
			setIsLeaveRepoModalOpen(false);
		}
	}

	if (repoLoading || loading) return <MemberPageSkeleton />;
	if (!repo) return null;

	return (
		<div className="p-6 space-y-6">
			{/* Repository Header */}
			<div className="flex flex-col md:flex-row items-start justify-between">
				<AnimatedSlide
					x={-20}
					triggerOnView={false}
					className="w-full space-y-3 mb-2"
				>
					<div className="flex items-center gap-4">
						<h1 className="text-3xl text-gray-900 dark:text-white">
							Team Members
						</h1>
						<Badge className="h-fit">{repo.provider}</Badge>
					</div>
					<p className="text-gray-600 dark:text-gray-400 inline w-100">
						List of collaborators and their permissions for{" "}
						<span>{firstCharUpperCase(repo.name)} </span>
						repository.
					</p>
				</AnimatedSlide>
				<AnimatedSlide
					x={20}
					triggerOnView={false}
					className="flex gap-3 mt-4 md:mt-0 w-full justify-end"
				>
					{isUserAdmin ? (
						<Button
							onClick={() => setIsAddMemberModalOpen(true)}
							className="flex items-center justify-center w-34 h-8 bg-gray-900 text-white dark:bg-gray-200 dark:text-black shadow-md hover:bg-gray-700 hover:dark:bg-gray-400 hover:cursor-pointer group"
						>
							<UserPlus className="w-4 h-4 mr-2 group-hover:scale-125 duration-250" />
							Invite Member
						</Button>
					) : (
						<Button
							onClick={() => setIsLeaveRepoModalOpen(true)}
							className="flex items-center justify-center w-fit px-2 h-8 bg-gray-900 text-white dark:bg-gray-200 dark:text-black shadow-md hover:bg-gray-700 hover:dark:bg-gray-400 hover:cursor-pointer group"
						>
							<LogOut className="w-4 h-4 mr-2 group-hover:scale-125 duration-250" />
							Leave Repository
						</Button>
					)}
				</AnimatedSlide>
			</div>

			{/* Members List */}
			<AnimatedSlide y={20} triggerOnView={false}>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle>Current Members ({members.length})</CardTitle>
						<CardDescription>
							People with access to this repository
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{members.map((member) => (
								<MemberListItem
									key={member.id}
									member={member}
									onDelete={setMemberToDelete}
									showDeleteButton={isUserAdmin}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			</AnimatedSlide>

			{/* Modals */}
			<AddMemberModal
				isOpen={isAddMemberModalOpen}
				onClose={() => setIsAddMemberModalOpen(false)}
				repoId={repoId}
			/>

			<LeaveRepoModal
				isOpen={isLeaveRepoModalOpen}
				repoName={repo.name}
				onClose={() => setIsLeaveRepoModalOpen(false)}
				onConfirm={removeMember}
				disabled={memberDeleteLoading}
			/>

			<DeleteMemberModal
				member={memberToDelete}
				onClose={() => setMemberToDelete(null)}
				onConfirm={removeMember}
				disabled={memberDeleteLoading}
			/>
		</div>
	);
}
