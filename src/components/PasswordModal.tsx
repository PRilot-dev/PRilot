"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useUser } from "@/contexts/UserContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Modal } from "./Modal";

type PasswordModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

export function PasswordModal({ isOpen, onClose }: PasswordModalProps) {
	const { refreshUser, user } = useUser();
	const [currentPassword, setCurrentPassword] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	if (!user) return null;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!user) return;

		if (password !== confirmPassword) {
			return toast.error("Passwords do not match");
		}

		setLoading(true);

		try {
			const res = await fetchWithAuth("/api/auth/password", {
				method: user.hasPassword ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(
					user.hasPassword
						? { currentPassword, newPassword: password, confirmPassword }
						: { password, confirmPassword },
				),
			});

			const data = await res.json();

			if (!res.ok) {
				const message =
					data.error?.fieldErrors
						? Object.values(data.error.fieldErrors).flat().join(", ")
						: data.error || "Something went wrong";
				return toast.error(message);
			}

			toast.success(data.message);
			setCurrentPassword("");
			setPassword("");
			setConfirmPassword("");
			await refreshUser();
			onClose();
		} catch {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={user.hasPassword ? "Change password" : "Create password"}
			size="md"
		>
			{!user.hasPassword && (
				<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
					Set a password to enable credentials-based login alongside your linked account.
				</p>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				{user.hasPassword && (
					<div className="flex flex-col gap-1">
						<label htmlFor="currentPassword">Current password</label>
						<input
							required
							id="currentPassword"
							type="password"
							placeholder="Current password"
							className="mt-2 w-full border border-gray-300 dark:border-gray-700 p-2 rounded-lg bg-gray-300/40 dark:bg-gray-900/40 focus:outline-none"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
						/>
					</div>
				)}

				<div className="flex flex-col gap-1">
					<label htmlFor="newPassword">
						{user.hasPassword ? "New password" : "Password"}
					</label>
					<input
						required
						id="newPassword"
						type="password"
						placeholder={user.hasPassword ? "New password" : "Password"}
						className="mt-2 w-full border border-gray-300 dark:border-gray-700 p-2 rounded-lg bg-gray-300/40 dark:bg-gray-900/40 focus:outline-none"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>

				<div className="flex flex-col gap-1">
					<label htmlFor="confirmPassword">Confirm password</label>
					<input
						required
						id="confirmPassword"
						type="password"
						placeholder="Confirm password"
						className="mt-2 w-full border border-gray-300 dark:border-gray-700 p-2 rounded-lg bg-gray-300/40 dark:bg-gray-900/40 focus:outline-none"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="w-full mt-2 h-10 rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-black hover:cursor-pointer hover:opacity-90 disabled:opacity-50"
				>
					{loading
						? "Loading..."
						: user.hasPassword
							? "Update password"
							: "Create password"}
				</button>
			</form>
		</Modal>
	);
}
