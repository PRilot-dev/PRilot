"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import z from "zod";
import OAuthButtons from "@/components/buttons/OAuthButtons";
import ThemeSwitcher from "@/components/navbar/ThemeSwitcher";
import LoadingSpinner from "@/components/skeletons/LoadingSpinner";
import LoginSkeleton from "@/components/skeletons/LoginSkeleton";
import AuthTabs from "@/components/ui/AuthTabs";
import CodeVerification from "@/components/ui/CodeVerification";
import EmailCodeForm from "@/components/ui/EmailCodeForm";
import FormInput from "@/components/ui/FormInput";
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
		handleSendCode,
		handleVerifyCode,
		resetCode,
	} = useAuth();

	const [password, setPassword] = useState("");

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

	if (userLoading) return <LoginSkeleton />;

	if (user)
		return (
			<div className="flex flex-col items-center justify-center gap-4 min-h-screen bg-linear-to-b from-blue-100 to-white dark:from-zinc-950 dark:to-[#13131d]">
				<LoadingSpinner />
				<p className="text-2xl text-gray-500 dark:text-gray-400 animate-pulse">
					Logging you in...
				</p>
			</div>
		);

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

				{mode === "password" && <AuthTabs active="login" />}

				{mode === "password" ? (
					<>
						<form
							onSubmit={handlePasswordSubmit}
							className="flex flex-col gap-4 text-left"
						>
							<FormInput
								id="email"
								label="Email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={setEmail}
								required
							/>
							<FormInput
								id="password"
								label="Password"
								type="password"
								placeholder="********"
								value={password}
								onChange={setPassword}
								required
							/>
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
							<EmailCodeForm
								email={email}
								setEmail={setEmail}
								loading={loading}
								onSubmit={handleSendCode}
								description="We'll send a 6-digit code to your email. If you don't have an account, one will be created for you."
							/>
						) : (
							<CodeVerification
								email={email}
								code={code}
								setCode={setCode}
								loading={loading}
								onVerify={handleVerifyCode}
								onResend={handleSendCode}
								onChangeEmail={resetCode}
							/>
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

				<OAuthButtons />
			</div>
		</div>
	);
}
