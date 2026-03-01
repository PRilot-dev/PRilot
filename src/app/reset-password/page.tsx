"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ThemeSwitcher from "@/components/navbar/ThemeSwitcher";
import LoginSkeleton from "@/components/skeletons/LoginSkeleton";
import { useUser } from "@/contexts/UserContext";

export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const { user, loading: userLoading } = useUser();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	// Route guard
	useEffect(() => {
		if (!userLoading && user) {
			router.replace("/dashboard");
		}
	}, [userLoading, user, router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			return toast.error("Passwords do not match");
		}

		setLoading(true);

		try {
			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password, confirmPassword }),
			});

			const data = await res.json();

			if (!res.ok) {
				const message =
					data.error?.fieldErrors
						? Object.values(data.error.fieldErrors).flat().join(", ")
						: data.error || "Something went wrong";
				toast.error(message);
				setLoading(false);
				return;
			}

			toast.success("Password reset successfully");
			router.push("/login");
		} catch {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	if (userLoading || user) return <LoginSkeleton />;

	if (!token) {
		return (
			<div className="flex justify-center items-center min-h-screen bg-linear-to-b from-blue-100 to-white dark:from-zinc-950 dark:to-[#13131d]">
				<div className="fade-in-fast max-w-md w-full pt-4 pb-8 px-8 md:border border-gray-300 dark:border-gray-700 rounded-2xl text-center md:shadow-md md:bg-white/40 md:dark:bg-zinc-900/25">
					<h1 className="text-2xl font-semibold mb-4">Invalid reset link</h1>
					<p className="text-gray-600 dark:text-gray-400 mb-4">
						This password reset link is invalid or has expired.
					</p>
					<Link
						href="/forgot-password"
						className="text-blue-600 dark:text-blue-400 hover:underline"
					>
						Request a new reset link
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex justify-center items-center min-h-screen bg-linear-to-b from-blue-100 to-white dark:from-zinc-950 dark:to-[#13131d]">
			<div className="fade-in-fast max-w-md w-full pt-4 pb-8 px-8 md:border border-gray-300 dark:border-gray-700 rounded-2xl text-center md:shadow-md md:bg-white/40 md:dark:bg-zinc-900/25">
				<div className="flex justify-between items-center w-full max-w-md mb-8">
					<Link href="/login" className="hover:underline">
						← Back to login
					</Link>
					<ThemeSwitcher className="bg-transparent! hover:bg-gray-300! hover:dark:bg-cyan-800!" />
				</div>
				<h1 className="text-2xl font-semibold mb-2">Reset your password</h1>
				<h2 className="text-gray-700 dark:text-gray-300 mb-6">
					Enter your new password below
				</h2>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
					<div>
						<label
							htmlFor="password"
							className="block mb-1 text-gray-700 dark:text-gray-300 font-medium"
						>
							New password
						</label>
						<input
							id="password"
							type="password"
							placeholder="********"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full px-4 py-2 border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
						/>
					</div>
					<div>
						<label
							htmlFor="confirmPassword"
							className="block mb-1 text-gray-700 dark:text-gray-300 font-medium"
						>
							Confirm password
						</label>
						<input
							id="confirmPassword"
							type="password"
							placeholder="********"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							className="w-full px-4 py-2 border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="mt-2 w-full py-2 bg-blue-500 text-white rounded-xl font-semibold hover:cursor-pointer hover:bg-blue-600 disabled:opacity-50 transition"
					>
						{loading ? "Resetting..." : "Update password"}
					</button>
				</form>
			</div>
		</div>
	);
}
