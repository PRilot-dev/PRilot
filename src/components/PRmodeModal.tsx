"use client";

import { Modal } from "./Modal";

type PRModeModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

export function PRModeModal({ isOpen, onClose }: PRModeModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="PR Generation Modes" size="md">
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
		</Modal>
	);
}
