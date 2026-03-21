import { GitHubApiError } from "@/lib/server/error";
import type {
	GitBranch,
	GitCompareResult,
	GitPullRequestResult,
	GitRepositoriesResponse,
	IGitProviderApi,
	IGitProviderApp,
} from "@/lib/server/interfaces";

export class GitHubApiProvider implements IGitProviderApi {
	constructor(private readonly gitApp: IGitProviderApp) {}

	async listRepositories(
		installationId: string,
	): Promise<GitRepositoriesResponse> {
		const data = await this.fetch<{
			total_count: number;
			repositories: Array<{
				id: number;
				name: string;
				full_name: string;
				private: boolean;
				default_branch: string;
				owner: { login: string; id: number; type: string };
			}>;
		}>(installationId, "/installation/repositories");

		return {
			totalCount: data.total_count,
			repositories: data.repositories.map((r) => ({
				id: r.id,
				name: r.name,
				fullName: r.full_name,
				isPrivate: r.private,
				defaultBranch: r.default_branch,
				owner: {
					login: r.owner.login,
					id: r.owner.id,
					type: r.owner.type,
				},
			})),
		};
	}

	async listBranches(
		installationId: string,
		owner: string,
		repo: string,
	): Promise<GitBranch[]> {
		const data = await this.fetch<
			Array<{
				name: string;
				commit: { sha: string };
				protected: boolean;
			}>
		>(installationId, `/repos/${owner}/${repo}/branches`);

		return data.map((b) => ({
			name: b.name,
			commitSha: b.commit.sha,
			isProtected: b.protected,
		}));
	}

	async compareBranches(
		installationId: string,
		owner: string,
		repo: string,
		baseBranch: string,
		compareBranch: string,
	): Promise<GitCompareResult> {
		const data = await this.fetch<{
			files?: Array<{
				filename: string;
				status: string;
				additions: number;
				deletions: number;
				changes: number;
				patch?: string;
			}>;
			commits: Array<{
				commit: { message: string };
				parents: Array<{ sha: string }>;
			}>;
		}>(
			installationId,
			`/repos/${owner}/${repo}/compare/${baseBranch}...${compareBranch}`,
		);

		return {
			files: data.files?.map((f) => ({
				filename: f.filename,
				status: f.status as
					| "added"
					| "modified"
					| "deleted"
					| "renamed"
					| "copied",
				additions: f.additions,
				deletions: f.deletions,
				changes: f.changes,
				patch: f.patch,
			})),
			commits: data.commits
				.filter((c) => c.parents.length === 1)
				.map((c) => c.commit.message),
		};
	}

	async createPullRequest(
		installationId: string,
		owner: string,
		repo: string,
		params: {
			title: string;
			body: string;
			baseBranch: string;
			headBranch: string;
		},
	): Promise<GitPullRequestResult> {
		const data = await this.fetch<{
			html_url: string;
			number: number;
			state: string;
		}>(installationId, `/repos/${owner}/${repo}/pulls`, {
			method: "POST",
			body: {
				title: params.title,
				body: params.body,
				base: params.baseBranch,
				head: params.headBranch,
			},
		});

		return {
			url: data.html_url,
			number: data.number,
			state: data.state,
		};
	}

	// ─── Internal helpers ────────────────────────────────────

	private async fetch<T>(
		installationId: string,
		path: string,
		options?: { method?: string; body?: object },
	): Promise<T> {
		const { token } = await this.gitApp.createInstallationAccessToken(
			installationId,
		);

		const res = await fetch(`https://api.github.com${path}`, {
			method: options?.method ?? "GET",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
				...(options?.body && { "Content-Type": "application/json" }),
			},
			body: options?.body ? JSON.stringify(options.body) : undefined,
		});

		if (!res.ok) {
			const body = await res.json().catch(() => null);
			throw new GitHubApiError(
				res.status,
				body?.message ?? "GitHub API error",
			);
		}

		return (await res.json()) as T;
	}
}
