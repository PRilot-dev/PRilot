"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRepos } from "@/contexts/ReposContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { IInvitation } from "@/types/repos";
import { Button } from "./Button";
import { Modal } from "./Modal";

type PendingInviteModalProps = {
	isOpen: boolean;
	invitation?: IInvitation | null;
	onClose: () => void;
};

export function PendingInviteModal({
	isOpen,
	invitation,
	onClose,
}: PendingInviteModalProps) {
	const { refreshData } = useRepos();
	const [loadingAction, setLoadingAction] = useState<"accept" | "decline" | null>(null);

	if (!invitation) return null;

	const handleAction = async (action: "accept" | "decline") => {
		setLoadingAction(action);
		try {
			const res = await fetchWithAuth(`/api/invitations/${action}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: invitation.token }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error);
			}

			toast.success(
				action === "accept"
					? `You joined ${invitation.repositoryName}!`
					: `You declined the invitation to ${invitation.repositoryName}`,
			);

			await refreshData();
			onClose();
		} catch (err) {
			console.error(err);
			toast.error(
				(err instanceof Error && err.message) || "Failed to process invitation",
			);
		} finally {
			setLoadingAction(null);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Repository Invitation">
			<p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
				You have been invited to join{" "}
				<span className="font-medium text-gray-900 dark:text-gray-100">{invitation.repositoryName}</span> by{" "}
				<span className="font-medium text-gray-900 dark:text-gray-100">{invitation.invitedBy}</span>
				.
			</p>

			<div className="flex flex-col md:flex-row w-full gap-4 mt-6">
				<Button
					onClick={() => handleAction("accept")}
					disabled={loadingAction !== null}
					className="flex-1 w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 transition-colors flex items-center justify-center gap-2"
				>
					{loadingAction === "accept" ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Processing...
						</>
					) : (
						"Accept"
					)}
				</Button>
				<Button
					onClick={() => handleAction("decline")}
					disabled={loadingAction !== null}
					className="flex-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 transition-colors flex items-center justify-center gap-2"
				>
					{loadingAction === "decline" ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Processing...
						</>
					) : (
						"Decline"
					)}
				</Button>
			</div>
		</Modal>
	);
}
