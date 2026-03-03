import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Page Not Found",
	robots: {
		index: false,
		follow: false,
	},
};

export default function NotFound() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
			<h1 className="text-6xl font-extrabold text-gray-900 dark:text-white">
				404
			</h1>
			<p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
				The page you're looking for doesn't exist.
			</p>
			<Link
				href="/"
				className="mt-8 px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
			>
				Back to home
			</Link>
		</div>
	);
}
