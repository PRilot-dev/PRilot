import type { IGitHubCompareResponse, IGitHubFile } from "@/types/commits";
import { githubFetch } from "./client";

interface CompareData {
	files: IGitHubFile[] | undefined;
	commits: string[];
}

/**
 * Fetches file diffs and commit messages between two branches in a single GitHub API call.
 * Commits are filtered to exclude merge commits.
 */
export async function getCompareData(
	installationId: string,
	owner: string,
	repoName: string,
	baseBranch: string,
	compareBranch: string,
): Promise<CompareData> {
	const compare = await githubFetch<IGitHubCompareResponse>(
		installationId,
		`/repos/${owner}/${repoName}/compare/${baseBranch}...${compareBranch}`,
	);

	return {
		files: compare.data.files,
		commits: compare.data.commits
			.filter((c) => c.parents.length === 1)
			.map((c) => c.commit.message),
	};
}
