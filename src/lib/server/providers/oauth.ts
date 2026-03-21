import { config } from "@/lib/server/config";
import type { IOAuthProvider } from "@/lib/server/interfaces";
import { GitHubOAuthProvider } from "./GitHubOAuthProvider";

export const oauthProvider: IOAuthProvider = new GitHubOAuthProvider({
	clientId: config.github.clientId,
	clientSecret: config.github.clientSecret,
});
