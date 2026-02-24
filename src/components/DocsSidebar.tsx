"use client";

import { useEffect, useRef, useState } from "react";

const sections = [
	{ id: "connect-github", label: "Connect GitHub" },
	{ id: "invite-members", label: "Invite Members" },
	{ id: "manage-members", label: "Manage Members" },
	{ id: "generate-pr", label: "Generate a PR" },
	{ id: "edit-pr", label: "Edit a PR" },
	{ id: "send-pr", label: "Send to GitHub" },
	{ id: "manage-prs", label: "Manage PRs" },
];

export default function DocsSidebar() {
	const [activeId, setActiveId] = useState<string>("");
	const observerRef = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		const headings = sections
			.map((s) => document.getElementById(s.id))
			.filter(Boolean) as HTMLElement[];

		if (headings.length === 0) return;

		observerRef.current = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveId(entry.target.id);
					}
				}
			},
			{ rootMargin: "-80px 0px -60% 0px", threshold: 0 },
		);

		for (const el of headings) {
			observerRef.current.observe(el);
		}

		return () => observerRef.current?.disconnect();
	}, []);

	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
		e.preventDefault();
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	return (
		<aside className="hidden lg:block w-52 shrink-0 sticky top-24">
			<p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
				On this page
			</p>
			<nav className="flex flex-col gap-1 border-l border-gray-200 dark:border-gray-800">
				{sections.map((s) => (
					<a
						key={s.id}
						href={`#${s.id}`}
						onClick={(e) => handleClick(e, s.id)}
						className={`text-sm py-1 pl-3 -ml-px border-l-2 transition-colors ${
							activeId === s.id
								? "border-blue-500 text-blue-600 dark:text-blue-400 font-medium"
								: "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
						}`}
					>
						{s.label}
					</a>
				))}
			</nav>
		</aside>
	);
}
