import type { IGitHubFile } from "@/types/commits";

/**
 * Prepares a file diff for AI processing.
 *
 * Returns an object:
 * {
 *   file: string;       // path + filename
 *   changes: number;    // number of lines changed (from GitHub)
 *   patch: string;      // AI-ready patch content
 * }
 *
 * Patch formatting rules:
 * - Modified file:
 *   Only lines starting with '+' or '-' are included, preserving the prefix.
 *   Example:
 *     +  text?: string;
 *     -  className={`p-2 text-[var(--blue-1)] ...`}
 *
 * - Added file:
 *   Only lines starting with '+' are included, '+' removed (entire content is new).
 *   Example:
 *     export const NewButton = () => { return <button /> }
 *
 * - Deleted file:
 *   Single line indicating the file was deleted.
 *   Example:
 *     File src/components/OldButton.tsx was deleted.
 */
export function prepareFileDiffForAI(file: IGitHubFile) {
	let patch = "";

	if (file.status === "deleted") {
		patch = `--- a/${file.filename}\n+++ /dev/null\nFile deleted.`;
	} else if (!file.patch) {
		patch = `File ${file.filename} was ${file.status}, but diff is unavailable (file too large or binary).`;
	} else {
		patch = [
			`diff --git a/${file.filename} b/${file.filename}`,
			`status: ${file.status}`,
			file.patch,
		].join("\n");
	}

	return {
		filename: file.filename,
		status: file.status,
		changes: file.changes,
		patch,
	};
}
