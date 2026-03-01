"use client";

import type { PRFilter } from "@/types/pullRequests";
import { Modal } from "./Modal";

type PRFilterModalProps = {
	isOpen: boolean;
	value: PRFilter;
	onClose: () => void;
	onSelect: (value: PRFilter) => void;
};

export function PRFilterModal({
	isOpen,
	value,
	onClose,
	onSelect,
}: PRFilterModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Filter Pull Requests">
			<div className="space-y-2">
				{(["all", "draft", "sent"] as const).map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => onSelect(option)}
						className={`
							w-full rounded-lg px-4 py-2 text-left transition-colors cursor-pointer
							${
								value === option
									? "bg-gray-200 dark:bg-gray-700 font-medium"
									: "hover:bg-gray-200/60 dark:hover:bg-gray-700/60"
							}
						`}
					>
						{option === "all"
							? "All PRs"
							: option === "draft"
								? "Draft PRs"
								: "Sent PRs"}
					</button>
				))}
			</div>
		</Modal>
	);
}
