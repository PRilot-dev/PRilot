"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Modal } from "./Modal";

type ConfirmDeletePRModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
};

export function ConfirmDeletePRModal({
	isOpen,
	onClose,
	onConfirm,
}: ConfirmDeletePRModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Delete draft PR">
			<p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
				This action is irreversible. Are you sure you want to delete this
				draft pull request?
			</p>

			<div className="flex justify-end gap-2">
				<Button variant="ghost" onClick={onClose}>
					Cancel
				</Button>
				<Button
					onClick={onConfirm}
					className="bg-red-600 hover:bg-red-700 text-white"
				>
					<Trash2 className="w-4 h-4 mr-2" />
					Delete
				</Button>
			</div>
		</Modal>
	);
}
