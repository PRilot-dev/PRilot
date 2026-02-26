"use client";

import { CirclePlus, Github, PlugZap } from "lucide-react";

interface GithubAppButtonProps {
	appName: string;
	redirectUri?: string;
	variant?: "default" | "settings";
	className?: string;
	label?: string;
}

export default function GithubAppButton({
	appName,
	redirectUri,
	variant = "default",
	className,
	label,
}: GithubAppButtonProps) {
	const handleConnect = () => {
		let url = `https://github.com/apps/${appName}/installations/new`;
		if (redirectUri) {
			url += `?redirect_uri=${encodeURIComponent(redirectUri)}`;
		}

		window.location.href = url;
	};

	if (variant === "settings") {
		return (
			<div className={`flex flex-col gap-4 ${className ?? ""}`}>
				<div className="flex items-center gap-3">
					<Github />
					<span>GitHub</span>
				</div>

				<button
					type="button"
					onClick={handleConnect}
					className="flex justify-center items-center gap-2 h-10 px-3 rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-black hover:cursor-pointer hover:opacity-90"
				>
					<PlugZap size={20} />
					Connect
				</button>
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={handleConnect}
			className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mt-2 cursor-pointer hover:underline"
		>
			<CirclePlus size={16} /> {label ?? "Connect your account"}
		</button>
	);
}
