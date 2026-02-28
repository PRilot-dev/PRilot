import Link from "next/link";

interface AuthTabsProps {
	active: "login" | "signup";
}

export default function AuthTabs({ active }: AuthTabsProps) {
	const inactiveClass =
		"text-gray-500 dark:text-gray-400";

	return (
		<section className="grid grid-cols-2 max-w-xs mx-auto rounded-xl mb-6 overflow-hidden border border-gray-200 dark:border-gray-700">
			<Link
				href="/login?mode=password"
				className={`bg-gray-200 dark:bg-gray-800 py-2 font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition ${active !== "login" ? inactiveClass : ""}`}
			>
				Login
			</Link>
			<Link
				href="/signup?mode=password"
				className={`bg-gray-200 dark:bg-gray-800 py-2 font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition ${active !== "signup" ? inactiveClass : ""}`}
			>
				Register
			</Link>
		</section>
	);
}
