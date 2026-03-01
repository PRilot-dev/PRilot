"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Button } from "./Button";
import { Modal } from "./Modal";

type AddMemberModalProps = {
	isOpen: boolean;
	onClose: () => void;
	repoId: string;
};

export function AddMemberModal({
	isOpen,
	onClose,
	repoId,
}: AddMemberModalProps) {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await fetchWithAuth(`/api/repos/${repoId}/invitations`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data?.error || "Failed to send invite");
			}

			toast.success(`Invitation sent to ${email}!`);
			onClose();
			setEmail("");
		} catch (err) {
			console.log("Error sending email invite: ", err);
			toast.error(
				(err instanceof Error && err.message) ||
					"We can't send your invite for now... Please try again later.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Invite member">
			<form onSubmit={handleSubmit} className="space-y-6">
				<input
					required
					type="email"
					placeholder="user@email.com"
					className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-zinc-950 focus:outline-none"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					disabled={loading}
				/>

				<Button
					className="w-full h-9 rounded-lg bg-gray-900 text-white dark:bg-gray-200 dark:text-black hover:cursor-pointer hover:opacity-90 disabled:opacity-50"
					disabled={loading}
				>
					{loading ? "Sending..." : "Send invite"}
				</Button>
			</form>
		</Modal>
	);
}
