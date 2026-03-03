"use client";

import { CircleCheck, Github, Gitlab, Lock, LogOut, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import AnimatedScale from "@/components/animations/AnimatedScale";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import { ConnectButton } from "@/components/buttons/ConnectButton";
import GithubAppButton from "@/components/buttons/GithubAppButton";
import { PasswordModal } from "@/components/modals/PasswordModal";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/Card";
import { useInstallations } from "@/contexts/InstallationContext";
import { useUser } from "@/contexts/UserContext";
import { config } from "@/lib/client/config";
import type { IOAuthProvider } from "@/types/user";

export default function UserSettingsPage() {
	const { user } = useUser();
	const { installations } = useInstallations();
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
	const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

	const handleLogoutAll = async () => {
		setIsLoggingOutAll(true);
		try {
			const res = await fetch("/api/auth/logout-all", {
				method: "POST",
				credentials: "include",
			});
			if (!res.ok) throw new Error();
			toast.success("All sessions have been terminated.");
			window.location.href = "/login";
		} catch {
			toast.error("Failed to logout all devices.");
		} finally {
			setIsLoggingOutAll(false);
		}
	};

	// User object is guaranteed to be present due to route guard in layout.tsx
	if (!user) return null;

	// Check OAuth providers
	const githubOAuth =
		user.oauthProviders?.includes("github" as IOAuthProvider) ?? false;
	const gitlabOAuth =
		user.oauthProviders?.includes("gitlab" as IOAuthProvider) ?? false;

	// Check installations
	const githubInstalls = installations.filter((i) => i.provider === "github");
	const gitlabInstalled = installations.some((i) => i.provider === "gitlab");

	return (
		<>
			<div className="p-6 space-y-6 fade-in-fast">
				{/* Header */}
				<AnimatedSlide x={-20} triggerOnView={false}>
					<h1 className="text-3xl text-gray-900 dark:text-white mb-2">
						User settings
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Manage your account and connected services.
					</p>
				</AnimatedSlide>

				{/* Account info */}
				<AnimatedScale scale={0.96} triggerOnView={false}>
					<Card>
						<CardHeader>
							<CardTitle>Account</CardTitle>
							<CardDescription>Your personal information</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600 dark:text-gray-400">
									Email
								</span>
								<span>{user.email}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600 dark:text-gray-400">
									Username
								</span>
								<span>{user.username}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600 dark:text-gray-400">
									Member since
								</span>
								<span>{new Date(user.createdAt).toLocaleDateString()}</span>
							</div>
						</CardContent>
					</Card>
				</AnimatedScale>

				{/* Security */}
				<AnimatedScale scale={0.96} triggerOnView={false}>
					<Card>
						<CardHeader>
							<CardTitle>Security</CardTitle>
						</CardHeader>
						<CardContent className="grid lg:grid-cols-2">
							<div className="space-y-2 lg:pr-8 lg:border-r border-gray-500">
								<CardDescription className="text-lg font-bold">
									{user.hasPassword
										? "Manage your password"
										: "Add a password to enable credentials-based login alongside your linked account"}
								</CardDescription>
								<button
									type="button"
									onClick={() => setIsPasswordModalOpen(true)}
									className="flex justify-center items-center gap-2 w-full h-10 rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-black hover:cursor-pointer hover:opacity-90"
								>
									<Lock size={16} />
									{user.hasPassword ? "Change password" : "Create password"}
								</button>
							</div>

							<div className="lg:ml-8 border-t border-gray-400 dark:border-gray-500 pt-6 mt-6 lg:pt-0 lg:mt-0 lg:border-none">
								<CardDescription className="text-lg font-bold mb-2">
									External authentication providers linked to your account
								</CardDescription>
								<div className="flex gap-3">
									<span
										className={`inline-flex items-center gap-2 px-3 h-10 rounded-lg border text-sm 
											${githubOAuth ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400" 
												: "bg-gray-100 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
											}`}
									>
										<Github size={16} />
										GitHub
										{githubOAuth ? (
											<CircleCheck size={14} />
										) : (
											<XCircle size={14} />
										)}
									</span>
									<span
										className={`inline-flex items-center gap-2 px-3 h-10 rounded-lg border text-sm 
											${gitlabOAuth ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400" 
												: "bg-gray-100 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
											}`}
									>
										<Gitlab size={16} />
										GitLab
										{gitlabOAuth ? (
											<CircleCheck size={14} />
										) : (
											<XCircle size={14} />
										)}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</AnimatedScale>

				{/* Connected installations */}
				<AnimatedScale scale={0.96} triggerOnView={false}>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle>Connected installations</CardTitle>
							<CardDescription>
								Providers currently connected to your account
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 grid lg:grid-cols-2 gap-4 lg:gap-0 mt-4">
							<div className="flex flex-col gap-4 lg:pr-8 lg:border-r border-gray-500">
								<div className="flex items-center gap-3">
									<Github />
									<span>GitHub</span>
								</div>

								{githubInstalls.length > 0 ? (
									<>
										{githubInstalls.map((inst) => (
											<div
												key={inst.id}
												className="flex items-center justify-between px-4 py-2 h-10 gap-2 bg-gray-100 dark:bg-gray-950 
												rounded-lg border border-gray-200 dark:border-none dark:outline dark:outline-gray-800"
											>
												<span className="text-sm text-gray-700 dark:text-gray-300">
													{inst.accountLogin}
													<span className="ml-2 text-xs text-gray-400">
														({inst.accountType})
													</span>
												</span>
												<span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
													<CircleCheck size={14} />
													Connected
												</span>
											</div>
										))}
										<div className="pl-4">
											<GithubAppButton
												appName={config.github.appName}
												redirectUri={`${config.frontendUrl}/github/callback`}
												label="Add another account"
											/>
										</div>
									</>
								) : (
									<GithubAppButton
										appName={config.github.appName}
										redirectUri={`${config.frontendUrl}/github/callback`}
										variant="settings"
									/>
								)}
							</div>
							<ConnectButton
								providerName="GitLab"
								connected={gitlabInstalled}
								onConnect={() => toast.info("GitLab integration isn't available yet.")}
								icon={<Gitlab />}
								className="lg:ml-8"
							/>
						</CardContent>
					</Card>
				</AnimatedScale>

				{/* Sessions */}
				<AnimatedScale scale={0.96} triggerOnView={false}>
					<Card>
						<CardHeader>
							<CardTitle>Sessions</CardTitle>
							<CardDescription>
								If you suspect your account has been compromised, log out of all
								devices to revoke every active session.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<button
								type="button"
								onClick={handleLogoutAll}
								disabled={isLoggingOutAll}
								className="w-full md:w-fit flex justify-center items-center gap-2 h-10 px-4 md:px-8 my-4 rounded-lg bg-red-600 text-white hover:cursor-pointer hover:opacity-90 disabled:opacity-50"
							>
								<LogOut size={16} />
								{isLoggingOutAll ? "Logging out..." : "Logout all devices"}
							</button>
						</CardContent>
					</Card>
				</AnimatedScale>
			</div>

			{/* Password modal */}
			<PasswordModal
				isOpen={isPasswordModalOpen}
				onClose={() => setIsPasswordModalOpen(false)}
			/>
		</>
	);
}
