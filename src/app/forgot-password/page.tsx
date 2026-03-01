"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ThemeSwitcher from "@/components/navbar/ThemeSwitcher";
import LoginSkeleton from "@/components/skeletons/LoginSkeleton";
import { useUser } from "@/contexts/UserContext";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const { user, loading: userLoading } = useUser();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	// Route guard
	useEffect(() => {
		if (!userLoading && user) {
			router.replace("/dashboard");
		}
	}, [userLoading, user, router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Something went wrong");
				setLoading(false);
				return;
			}

			setSent(true);
			toast.success(data.message);
		} catch {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	if (userLoading || user) return <LoginSkeleton />;

	return (
		<div className="flex justify-center items-center min-h-screen bg-linear-to-b from-blue-100 to-white dark:from-zinc-950 dark:to-[#13131d]">
			<div className="fade-in-fast max-w-md w-full pt-4 pb-8 px-8 md:border border-gray-300 dark:border-gray-700 rounded-2xl text-center md:shadow-md md:bg-white/40 md:dark:bg-zinc-900/25">
				<div className="flex justify-between items-center w-full max-w-md mb-8">
					<Link href="/login" className="hover:underline">
						← Back to login
					</Link>
					<ThemeSwitcher className="bg-transparent! hover:bg-gray-300! hover:dark:bg-cyan-800!" />
				</div>
				<h1 className="text-2xl font-semibold mb-2">
					{sent ? "Reset password link sent" : "Forgot your password?"}
				</h1>
				{!sent && (
					<h2 className="text-gray-700 dark:text-gray-300 mb-6">
						Enter your email and we&apos;ll send you a reset link
					</h2>
				)}

				{sent ? (
					<p className="mt-8 text-gray-600 dark:text-gray-400">
						If an account exists with this email, you&apos;ll receive a password
						reset link shortly.
					</p>
				) : (
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-4 text-left"
					>
						<div>
							<label
								htmlFor="email"
								className="block mb-1 text-gray-700 dark:text-gray-300 font-medium"
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full px-4 py-2 border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="mt-2 w-full py-2 bg-blue-500 text-white rounded-xl font-semibold hover:cursor-pointer hover:bg-blue-600 disabled:opacity-50 transition"
						>
							{loading ? "Sending..." : "Send reset link"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
