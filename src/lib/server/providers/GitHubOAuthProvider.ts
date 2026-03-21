import { UnauthorizedError } from "@/lib/server/error";
import type {
	IOAuthProvider,
	OAuthTokenResult,
	OAuthUserProfile,
} from "@/lib/server/interfaces";

interface GitHubOAuthConfig {
	clientId: string;
	clientSecret: string;
}

export class GitHubOAuthProvider implements IOAuthProvider {
	constructor(private readonly config: GitHubOAuthConfig) {}

	async exchangeCodeForToken(code: string): Promise<OAuthTokenResult> {
		const res = await fetch(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: { Accept: "application/json" },
				body: new URLSearchParams({
					client_id: this.config.clientId,
					client_secret: this.config.clientSecret,
					code,
				}),
			},
		);

		const data = (await res.json()) as {
			access_token?: string;
			error?: string;
		};

		if (!data.access_token) {
			throw new UnauthorizedError("Failed to get access token");
		}

		return { accessToken: data.access_token };
	}

	async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
		// 1. Fetch user profile
		const userRes = await fetch("https://api.github.com/user", {
			headers: { Authorization: `Bearer ${accessToken}` },
		});

		const user = (await userRes.json()) as {
			id?: number;
			login?: string;
			email?: string | null;
		};

		// 2. Resolve email (fetch from /user/emails if private)
		let email = user.email;
		if (!email) {
			const emailsRes = await fetch(
				"https://api.github.com/user/emails",
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				},
			);

			if (!emailsRes.ok) {
				throw new UnauthorizedError("Failed to fetch GitHub emails");
			}

			const emailsData = await emailsRes.json();
			const emails = Array.isArray(emailsData) ? emailsData : [];

			const primaryEmail = emails.find(
				(e: { primary?: boolean; verified?: boolean; email?: string }) =>
					e.primary && e.verified && typeof e.email === "string",
			)?.email;

			if (!primaryEmail) {
				throw new UnauthorizedError("No verified GitHub email found");
			}

			email = primaryEmail;
		}

		// 3. Validate
		if (!user.id || !user.login || !email) {
			throw new UnauthorizedError("Failed to get GitHub user info");
		}

		return {
			providerUserId: user.id.toString(),
			login: user.login,
			email,
		};
	}
}
