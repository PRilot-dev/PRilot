"use client";

import { Gitlab } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import z from "zod";
import GithubButton from "@/components/GithubButton";
import LoginSkeleton from "@/components/LoginSkeleton";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useUser } from "@/contexts/UserContext";
import { passwordValidationSchema } from "@/lib/schemas/auth.schema";

export default function SignupPage() {
	const router = useRouter();
	const { user, loading: userLoading, setUser } = useUser();
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	// Route guard
	useEffect(() => {
		if (!userLoading && user) {
			router.replace("/dashboard");
		}
	}, [userLoading, user, router]);

	// Signup fetch
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Basic empty fields check
			if (!email || !username || !password || !confirmPassword) {
				toast.error("Please fill in all fields");
				setLoading(false);
				return;
			}

			// Username length check
			if (username.length < 2 || username.length > 30) {
				toast.error(
					"Username must be at least 2 characters long and max 30 characters",
				);
				setLoading(false);
				return;
			}

			// Check password confirmation
			if (password !== confirmPassword) {
				toast.error("Passwords do not match");
				setLoading(false);
				return;
			}

			// Validate passwords
			const validatedPassword =
				await passwordValidationSchema.parseAsync(password);

			const validatedConfirmPassword =
				await passwordValidationSchema.parseAsync(confirmPassword);

			// Send signup request
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					username,
					password: validatedPassword,
					confirmPassword: validatedConfirmPassword,
				}),
				credentials: "include",
			});

			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Signup failed");
				setLoading(false);
				return;
			}

			// Update context
			setUser(data.user);

			// Redirect to dashboard
			router.push("/dashboard");
			toast.success("Welcome to PRilot! 🚀");
		} catch (err) {
			if (err instanceof z.ZodError) {
				toast.error(
					"Your password needs at least 8 characters, including a capital letter, a number, and a special symbol 🔒",
				);
			} else {
				toast.error("An unexpected error occurred");
				console.error(err);
			}
			setLoading(false);
		}
	};

	// Loading fallback
	if (userLoading || user) return <LoginSkeleton />;

	return (
		<div className="flex justify-center items-center min-h-screen bg-linear-to-b from-blue-100 to-white dark:from-zinc-950 dark:to-[#13131d]">
			<div className="max-w-md w-full pt-4 pb-8 px-8 md:border border-gray-300 dark:border-gray-700 rounded-2xl text-center md:shadow-md md:bg-white/40 md:dark:bg-zinc-900/25">
				<div className="flex justify-between items-center w-full max-w-md mb-2">
					<Link href="/" className="hover:underline">
						← Back
					</Link>
					<ThemeSwitcher className="bg-transparent! hover:bg-gray-300! hover:dark:bg-cyan-800!" />
				</div>
				<h1 className="text-2xl font-semibold mb-2">Welcome to PRilot</h1>
				<h2 className="text-gray-700 dark:text-gray-300 mb-6">
					Register to manage your repositories and PRs
				</h2>

				<section className="grid grid-cols-2 max-w-xs mx-auto rounded-xl mb-6 overflow-hidden border border-gray-200 dark:border-gray-700">
					<Link
						href="/login"
						className="bg-gray-200 dark:bg-gray-800 py-2 font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
					>
						Login
					</Link>
					<Link
						href="/signup"
						className="bg-gray-200 dark:bg-gray-800 py-2 font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition"
					>
						Register
					</Link>
				</section>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
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
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							className="w-full px-4 py-2 border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
						/>
					</div>

					<div>
						<label
							htmlFor="username"
							className="block mb-1 text-gray-700 dark:text-gray-300 font-medium"
						>
							Username
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="username"
							className="w-full px-4 py-2 border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block mb-1 text-gray-700 dark:text-gray-300 font-medium"
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="********"
							className="w-full px-4 py-2 border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
						/>
					</div>

					<div>
						<label
							htmlFor="confirm-password"
							className="block mb-1 text-gray-700 dark:text-gray-300 font-medium"
						>
							Confirm Password
						</label>
						<input
							id="confirm-password"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="********"
							className="w-full px-4 py-2 border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="mt-2 w-full py-2 bg-blue-500 text-white rounded-xl font-semibold hover:cursor-pointer hover:bg-blue-600 disabled:opacity-50 transition"
					>
						{loading ? "Creating account..." : "Sign Up"}
					</button>
				</form>

				<div className="my-4 flex items-center gap-2">
					<span className="grow h-px bg-gray-300 dark:bg-gray-600"></span>
					<span className="text-gray-500 dark:text-gray-400 text-sm">
						or continue with
					</span>
					<span className="grow h-px bg-gray-300 dark:bg-gray-600"></span>
				</div>

				<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 justify-center">
					<GithubButton />
					<button
						type="button"
						onClick={() => {
							toast.info("GitLab auth isn't available yet.");
						}}
						className="flex w-full md:w-auto justify-center items-center gap-2 px-4 py-2 border border-gray-400 rounded-xl hover:cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
					>
						<Gitlab className="w-5 h-5" />
						GitLab
					</button>
				</div>
			</div>
		</div>
	);
}
