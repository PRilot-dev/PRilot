"use client";

import { AnimatePresence } from "framer-motion";
import { BookOpen, Menu, Scale, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import LandingCTA from "@/components/landing/LandingCTA";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const navLinks = [
	{ label: "Features", href: "#features" },
	{ label: "Benefits", href: "#benefits" },
	{ label: "How It Works", href: "#how-it-works" },
	{ label: "Example", href: "#example" },
	{ label: "FAQ", href: "#faq" },
];

export default function LandingNavbar() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const handleSmoothScroll = (
		e: React.MouseEvent<HTMLAnchorElement>,
		href: string,
	) => {
		e.preventDefault();
		const targetId = href.replace("#", "");
		const element = document.getElementById(targetId);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	return (
		<>
			<nav
				className={`fixed top-0 left-0 right-0 z-50 border-b transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
					scrolled
						? "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-gray-200 dark:border-gray-800 shadow-sm"
						: "bg-transparent border-transparent"
				}`}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Brand */}
						<Link
							href="/"
							className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
						>
							PRilot
						</Link>

						{/* Desktop nav links */}
						<div className="hidden md:flex items-center gap-8">
							{navLinks.map((link) => (
								<a
									key={link.href}
									href={link.href}
									onClick={(e) => handleSmoothScroll(e, link.href)}
									className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:dark:text-white transition-colors cursor-pointer"
								>
									{link.label}
								</a>
							))}
						</div>

						{/* Desktop right side */}
						<div className="hidden md:flex items-center gap-4">
							<ThemeSwitcher className="bg-white/70 dark:bg-gray-800 border border-blue-200 dark:border-cyan-800 hover:bg-gray-200 hover:dark:bg-gray-700" />
							<LandingCTA animated={false} />
						</div>

						{/* Mobile hamburger */}
						<div className="flex md:hidden items-center gap-3">
							<ThemeSwitcher className="bg-blue-100 dark:bg-gray-800 hover:bg-gray-200 hover:dark:bg-gray-700" />
							<button
								type="button"
								onClick={() => setMobileOpen(!mobileOpen)}
								className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
							>
								{mobileOpen ? (
									<X className="w-5 h-5" />
								) : (
									<Menu className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>
				</div>
			</nav>

			{/* Mobile menu - full screen slide from right */}
			<AnimatePresence>
				{mobileOpen && (
					<AnimatedSlide
						key="mobile-menu"
						x={400}
						damping={14}
						mass={0.7}
						className="md:hidden fixed right-0 top-16 bottom-0 w-full bg-white dark:bg-zinc-950 z-40 overflow-y-auto"
					>
						<div className="flex flex-col gap-6 p-8 min-h-full">
							{navLinks.map((link) => (
								<a
									key={link.href}
									href={link.href}
									onClick={(e) => {
										handleSmoothScroll(e, link.href);
										setMobileOpen(false);
									}}
									className="px-4 py-4 text-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer"
								>
									{link.label}
								</a>
							))}

							<div className="border-t border-gray-200 dark:border-gray-800 my-2" />

							<Link
								href="/docs"
								onClick={() => setMobileOpen(false)}
								className="flex items-center gap-3 px-4 py-4 text-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
							>
								<BookOpen size={18} />
								Documentation
							</Link>
							<Link
								href="/privacy"
								onClick={() => setMobileOpen(false)}
								className="flex items-center gap-3 px-4 py-4 text-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
							>
								<ShieldCheck size={18} />
								Privacy Policy
							</Link>
							<Link
								href="/terms"
								onClick={() => setMobileOpen(false)}
								className="flex items-center gap-3 px-4 py-4 text-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
							>
								<Scale size={18} />
								Terms of Service
							</Link>

							<div className="pt-4 mt-2 px-4">
								<LandingCTA animated={false} />
							</div>
						</div>
					</AnimatedSlide>
				)}
			</AnimatePresence>
		</>
	);
}
