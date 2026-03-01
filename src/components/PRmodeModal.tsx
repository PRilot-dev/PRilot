"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

type PRModeModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

export function PRModeModal({ isOpen, onClose }: PRModeModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<button
				type="button"
				className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			<motion.div
				initial={{ opacity: 0, scale: 0.5 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.5 }}
				className="pointer-events-auto w-full max-w-md mx-2 rounded-xl bg-white dark:bg-zinc-950/95 border border-gray-200 dark:border-gray-800 p-6 shadow-lg z-50"
			>
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-semibold">PR Generation Modes</h3>
					<button
						type="button"
						onClick={onClose}
						className="opacity-70 hover:opacity-100 transition cursor-pointer"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Body */}
				<div className="space-y-4">
					<div>
						<h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
							- Fast Mode
						</h4>
						<p className="text-sm text-gray-700 dark:text-gray-300">
							Generates a PR using only the commit messages between the two
							branches. Works well when there are many well-written commit
							messages.
						</p>
					</div>
					<div>
						<h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
							- Deep Mode
						</h4>
						<p className="text-sm text-gray-700 dark:text-gray-300">
							Analyzes the raw file diffs and commit messages between the
							branches to generate a detailed, accurate PR description.
							Limited to 2000 lines of code changed.
						</p>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
