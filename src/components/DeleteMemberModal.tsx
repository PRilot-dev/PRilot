"use client";

import type { Member } from "@/types/members";
import { Modal } from "./Modal";

type DeleteMemberModalProps = {
	member: Member | null;
	onClose: () => void;
	onConfirm: () => void;
	disabled?: boolean;
};

export function DeleteMemberModal({ member, onClose, onConfirm, disabled }: DeleteMemberModalProps) {
	if (!member) return null;

	return (
		<Modal isOpen onClose={onClose} title={<span className="text-red-600">Remove member</span>}>
			<p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
				Are you sure you want to remove <strong>{member.username}</strong>?
				<br />
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
					Remove
				</button>
			</div>
		</Modal>
	);
}
