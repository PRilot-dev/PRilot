"use client";

import { X } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
	isOpen: boolean;
	onClose: () => void;
	title: string | ReactNode;
	size?: "sm" | "md";
	children: ReactNode;
};

export function Modal({
	isOpen,
	onClose,
	title,
	size = "sm",
	children,
}: ModalProps) {
	if (!isOpen) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="fixed inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			/>
			<motion.div
				initial={{ opacity: 0, scale: 0.5 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.5 }}
				className={`relative z-10 w-full ${size === "md" ? "max-w-md" : "max-w-sm"} mx-2 rounded-xl bg-white dark:bg-zinc-950/95 border border-gray-200 dark:border-gray-800 p-6 shadow-lg`}
			>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						className="hover:opacity-70 cursor-pointer transition"
					>
						<X className="w-5 h-5" />
					</button>
				</div>
				{children}
			</motion.div>
		</div>,
		document.body,
	);
}
