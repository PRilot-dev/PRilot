"use client";

import firstCharUpperCase from "@/lib/utils/firstCharUpperCase";
import { Modal } from "./Modal";

type DeleteRepoModalProps = {
	isOpen: boolean;
	repoName: string | null;
	onClose: () => void;
	onConfirm: () => void;
	disabled?: boolean;
};

export function DeleteRepoModal({
	isOpen,
	repoName,
	onClose,
	onConfirm,
	disabled,
}: DeleteRepoModalProps) {
	if (!repoName) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={<span className="text-red-600">Delete repository</span>}>
			<p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
				Are you sure you want to delete{" "}
				<strong>{firstCharUpperCase(repoName)}</strong>?
				<br />
				This will remove all members, invitations, and pull requests.
				This action cannot be undone.
			</p>

			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={onClose}
					className="px-4 h-9 rounded-lg border border-gray-400 dark:border-gray-600 hover:cursor-pointer hover:opacity-80"
				>
					Cancel
				</button>
				<button
					disabled={disabled}
					type="button"
					onClick={onConfirm}
					className="px-4 h-9 rounded-lg bg-red-600 text-white hover:cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Delete
				</button>
			</div>
		</Modal>
	);
}
