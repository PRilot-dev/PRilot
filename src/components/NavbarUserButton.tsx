"use client";

import { BookOpen, ChevronDown, Scale, Settings, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useCreditsStore } from "@/stores/creditsStore";
import LogoutButton from "./LogoutButton";
import ThemeSwitcher from "./ThemeSwitcher";

interface NavbarUserButtonProps {
	/** Called when this dropdown opens — parent uses it to close other dropdowns. */
	onOpen?: () => void;
}

export default function NavbarUserButton({ onOpen }: NavbarUserButtonProps) {
	const { user } = useUser();
	const {
		remaining: creditsRemaining,
		total: creditsTotal,
		loading: creditsLoading,
		fetchCredits,
	} = useCreditsStore();

	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	// Fetch credits when dropdown first opens
	useEffect(() => {
		if (!open) return;
		fetchCredits();
	}, [open, fetchCredits]);

	const userInitial = user?.username?.charAt(0).toUpperCase() ?? "?";

	const handleToggle = () => {
		const next = !open;
		setOpen(next);
		if (next) onOpen?.();
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={handleToggle}
				className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-200/80 dark:hover:bg-gray-800 cursor-pointer"
			>
				<div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
					{userInitial}
				</div>
				<span className="text-gray-700 dark:text-gray-300">
					{user?.username}
				</span>
				<ChevronDown
					size={14}
					className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="absolute top-full right-0 mt-1 w-60 bg-white dark:bg-[#09090B] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1">
					{/* Account header */}
					<div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 mb-1">
						<p className="text-xs text-gray-500 dark:text-gray-400">
							Signed in as
						</p>
						<p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
							{user?.username}
						</p>
					</div>

					{/* Settings */}
					<Link
						href="/dashboard/settings"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					>
						<Settings size={15} />
						Settings
					</Link>

					{/* Credits */}
					<div className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
						<Zap size={15} className="text-yellow-500 shrink-0" />
						<span className="flex-1">Credits left</span>
						{creditsLoading ? (
							<span className="text-xs text-gray-400">…</span>
						) : (
							<span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-white">
								{creditsRemaining !== null
									? `${creditsRemaining} / ${creditsTotal}`
									: "—"}
							</span>
						)}
					</div>

					{/* Theme */}
					<div className="flex items-center justify-between px-3 py-1.5">
						<span className="text-sm text-gray-700 dark:text-gray-300">
							Theme
						</span>
						<ThemeSwitcher
							size={15}
							className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
						/>
					</div>

					<div className="border-t border-gray-100 dark:border-gray-800 my-1" />

					{/* Docs */}
					<Link
						href="/docs"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					>
						<BookOpen size={15} />
						Documentation
					</Link>

					{/* Privacy */}
					<Link
						href="/privacy"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					>
						<ShieldCheck size={15} />
						Privacy Policy
					</Link>

					{/* Terms */}
					<Link
						href="/terms"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					>
						<Scale size={15} />
						Terms of Service
					</Link>

					<div className="border-t border-gray-100 dark:border-gray-800 my-1" />

					{/* Logout */}
					<LogoutButton
						variant="icon"
						size={15}
						showText
						text="Sign out"
						className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-600 dark:hover:text-red-400"
					/>
				</div>
			)}
		</div>
	);
}
