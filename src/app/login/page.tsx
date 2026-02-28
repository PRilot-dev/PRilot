"use client";

import { Gitlab, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import z from "zod";
import GithubButton from "@/components/GithubButton";
import LoginSkeleton from "@/components/LoginSkeleton";
import OtpInput from "@/components/OtpInput";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { passwordValidationSchema } from "@/lib/schemas/auth.schema";

export default function LoginPage() {
	const {
		email,
		setEmail,
		mode,
		setMode,
		code,
		setCode,
		codeSent,
		loading,
		setLoading,
		user,
		userLoading,
		setUser,
		router,
		handleSendCode,
		handleVerifyCode,
		resetCode,
	} = useAuth();

	const [password, setPassword] = useState("");

	// Password login
	const handlePasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const validatedPassword =
				await passwordValidationSchema.parseAsync(password);

			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password: validatedPassword }),
				credentials: "include",
			});

			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Login failed");
				setLoading(false);
				return;
			}

			setUser(data.user);
			router.push("/dashboard");
			toast.success("Welcome back!");
		} catch (err) {
			if (err instanceof z.ZodError) {
				toast.error(
					"Your password needs at least 8 characters, including a capital letter, a number, and a special symbol",
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
			<div className="fade-in-fast max-w-md w-full pt-4 pb-8 px-8 md:border border-gray-300 dark:border-gray-700 rounded-2xl text-center md:shadow-md md:bg-white/40 md:dark:bg-zinc-900/25">
				<div className="flex justify-between items-center w-full max-w-md mb-8">
					<Link href="/" className="hover:underline">
						&larr; Back
					</Link>
					<ThemeSwitcher className="bg-transparent! hover:bg-gray-300! hover:dark:bg-cyan-800!" />
				</div>
				<h1 className="text-2xl font-semibold mb-2">Welcome to PRilot</h1>
				<h2 className="text-gray-700 dark:text-gray-300 mb-6">
					Sign in to manage your repositories and PRs
				</h2>
				{mode === "password" && (
					<section className="grid grid-cols-2 max-w-xs mx-auto rounded-xl mb-6 overflow-hidden border border-gray-200 dark:border-gray-700">
						<Link
							href="/login?mode=password"
							className="bg-gray-200 dark:bg-gray-800 py-2 font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition"
						>
							Login
						</Link>
						<Link
							href="/signup?mode=password"
							className="bg-gray-200 dark:bg-gray-800 py-2 text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition"
						>
							Register
						</Link>
					</section>
				)}

				{mode === "password" ? (
					<>
						<form
							onSubmit={handlePasswordSubmit}
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
									placeholder="********"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="w-full px-4 py-2 border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
								/>
							</div>
							<div className="flex justify-center">
								<Link
									href="/forgot-password"
									className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
								>
									Forgot your password?
								</Link>
							</div>
							<button
								type="submit"
								disabled={loading}
								className="mt-2 w-full py-2 bg-blue-500 text-white rounded-xl font-semibold hover:cursor-pointer hover:bg-blue-600 disabled:opacity-50 transition"
							>
								{loading ? "Logging in..." : "Login"}
							</button>
						</form>
						<button
							type="button"
							onClick={() => setMode("code")}
							className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline hover:cursor-pointer"
						>
							Sign in with email code instead
						</button>
					</>
				) : (
					<>
						{!codeSent ? (
							<form
								onSubmit={handleSendCode}
								className="flex flex-col gap-4 text-left"
							>
								<div>
									<label
										htmlFor="code-email"
										className="block mb-1 text-gray-700 dark:text-gray-300 font-medium"
									>
										Email
									</label>
									<input
										id="code-email"
										type="email"
										placeholder="you@example.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="w-full px-4 py-2 border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
									/>
								</div>
								<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
									We&apos;ll send a 6-digit code to your email.
									{" "}If you don&apos;t have an account, one will be created for you.
								</p>
								<button
									type="submit"
									disabled={loading}
									className="mt-2 w-full py-2 bg-blue-500 text-white rounded-xl font-semibold hover:cursor-pointer hover:bg-blue-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
								>
									<Mail className="w-4 h-4" />
									{loading ? "Sending..." : "Send code"}
								</button>
							</form>
						) : (
							<div className="flex flex-col gap-4">
								<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
									Enter the 6-digit code sent to <strong>{email}</strong>
								</p>
								<OtpInput
									value={code}
									onChange={setCode}
									onComplete={handleVerifyCode}
									disabled={loading}
								/>
								{loading && (
									<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
										Verifying...
									</p>
								)}
								<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
									Didn&apos;t receive the sign-in code?{" "}
									<button
										type="button"
										onClick={(e) => {
											setCode("");
											handleSendCode(e);
										}}
										disabled={loading}
										className="text-blue-600 dark:text-blue-400 hover:underline hover:cursor-pointer disabled:opacity-50"
									>
										Send a new code
									</button>
								</p>
								<button
									type="button"
									onClick={resetCode}
									className="text-sm text-gray-500 dark:text-gray-400 hover:underline hover:cursor-pointer"
								>
									Use a different email
								</button>
							</div>
						)}
						<button
							type="button"
							onClick={() => {
								setMode("password");
								resetCode();
							}}
							className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline hover:cursor-pointer"
						>
							Sign in with password instead
						</button>
					</>
				)}

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
