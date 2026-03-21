import type { IGitProviderApi } from "@/lib/server/interfaces";
import { GitHubApiProvider } from "./GitHubApiProvider";
import { gitAppProvider } from "./git-app";

export const gitApiProvider: IGitProviderApi = new GitHubApiProvider(
	gitAppProvider,
);
