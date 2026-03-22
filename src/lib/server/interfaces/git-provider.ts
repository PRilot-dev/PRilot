// ============================
// ======== Data types ========
// ============================

/** A verified provider installation (e.g., GitHub App installation). */
export interface GitInstallationInfo {
	id: number;
	account: {
		login: string;
		id: number;
		type: string;
	};
	repositorySelection: "all" | "selected";
	permissions: Record<string, string>;
}

/** A repository as returned by the git provider. */
export interface GitRepository {
	id: number;
	name: string;
	fullName: string;
	isPrivate: boolean;
	defaultBranch: string;
	owner: {
		login: string;
		id: number;
		type: string;
	};
}

/** A branch reference. */
export interface GitBranch {
	name: string;
	commitSha: string;
	isProtected: boolean;
}

/** A file in a branch comparison. */
export interface GitCompareFile {
	filename: string;
	status: "added" | "modified" | "deleted" | "renamed" | "copied";
	additions: number;
	deletions: number;
	changes: number;
	patch?: string;
}

/** Result of comparing two branches. */
export interface GitCompareResult {
	files: GitCompareFile[] | undefined;
	/** Non-merge commit messages. */
	commits: string[];
}

/** Result of creating a pull request on the provider. */
export interface GitPullRequestResult {
	url: string;
	number: number;
	state: string;
}

/** Paginated repositories list from the provider. */
export interface GitRepositoriesResponse {
	totalCount: number;
	repositories: GitRepository[];
}

// ============================
// ======== Interfaces ========
// ============================

/**
 * App-level operations for a git provider installation.
 * Handles installation verification and access token creation.
 * Current implementation: GitHub App (JWT + installation tokens).
 */
export interface IGitProviderApp {
	/** Verify that an installation ID is valid and return its info. */
	verifyInstallation(installationId: string): Promise<GitInstallationInfo>;

	/** Create a short-lived access token for an installation. */
	createInstallationAccessToken(
		installationId: string,
	): Promise<{ token: string; expiresAt: string }>;
}

/**
 * Data operations against a git provider, scoped to an installation.
 * All methods require an installationId for authentication.
 * Current implementation: GitHub REST API via githubFetch.
 */
export interface IGitProviderApi {
	/** List repositories accessible to an installation. */
	listRepositories(installationId: string): Promise<GitRepositoriesResponse>;

	/** List branches for a repository. */
	listBranches(
		installationId: string,
		owner: string,
		repo: string,
	): Promise<GitBranch[]>;

	/** Compare two branches and return diffs + commit messages. */
	compareBranches(
		installationId: string,
		owner: string,
		repo: string,
		baseBranch: string,
		compareBranch: string,
	): Promise<GitCompareResult>;

	/** Get the approximate commit count for a branch. */
	getCommitCount(
		installationId: string,
		owner: string,
		repo: string,
		branch: string,
	): Promise<number>;

	/** Create a pull request on the provider. */
	createPullRequest(
		installationId: string,
		owner: string,
		repo: string,
		params: {
			title: string;
			body: string;
			baseBranch: string;
			headBranch: string;
		},
	): Promise<GitPullRequestResult>;
}
