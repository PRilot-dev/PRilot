import { config } from "@/lib/server/config";
import type { IGitProviderApp } from "@/lib/server/interfaces";
import { cacheProvider } from "./cache";
import { GitHubAppProvider } from "./GitHubAppProvider";

export const gitAppProvider: IGitProviderApp = new GitHubAppProvider(
	cacheProvider,
	{
		appId: config.github.appId,
		appPrivateKey: config.github.appPrivateKey,
	},
);
