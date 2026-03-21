import { createPrivateKey, type KeyObject } from "node:crypto";
import { SignJWT } from "jose";
import { decrypt, encrypt } from "@/lib/server/encryption";
import { BadRequestError } from "@/lib/server/error";
import type {
	GitInstallationInfo,
	ICacheProvider,
	IGitProviderApp,
} from "@/lib/server/interfaces";

interface GitHubAppConfig {
	appId: string;
	appPrivateKey: string;
}

const TOKEN_CACHE_TTL_SECONDS = 55 * 60; // 55 minutes (tokens expire after 1 hour)

export class GitHubAppProvider implements IGitProviderApp {
	private privateKey: KeyObject | null = null;

	constructor(
		private readonly cache: ICacheProvider,
		private readonly config: GitHubAppConfig,
	) {}

	async verifyInstallation(
		installationId: string,
	): Promise<GitInstallationInfo> {
		const jwt = await this.createAppJWT();

		const res = await fetch(
			`https://api.github.com/app/installations/${installationId}`,
			{
				headers: {
					Authorization: `Bearer ${jwt}`,
					Accept: "application/vnd.github+json",
				},
			},
		);

		if (!res.ok) {
			throw new BadRequestError("Invalid GitHub installation");
		}

		const data = await res.json();
		return {
			id: data.id,
			account: {
				login: data.account.login,
				id: data.account.id,
				type: data.account.type,
			},
			repositorySelection: data.repository_selection,
			permissions: data.permissions,
		};
	}

	async createInstallationAccessToken(
		installationId: string,
	): Promise<{ token: string; expiresAt: string }> {
		// 1. Check cache
		const cacheKey = `github:installation-token:${installationId}`;
		const cached = await this.cache.get<string>(cacheKey);
		if (cached) {
			return { token: decrypt(cached), expiresAt: "" };
		}

		// 2. Create fresh token from GitHub
		const jwt = await this.createAppJWT();

		const res = await fetch(
			`https://api.github.com/app/installations/${installationId}/access_tokens`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${jwt}`,
					Accept: "application/vnd.github+json",
				},
			},
		);

		if (!res.ok) {
			throw new BadRequestError(
				"Failed to create installation access token",
			);
		}

		const data = (await res.json()) as {
			token: string;
			expires_at: string;
			permissions: Record<string, string>;
		};

		// 3. Cache encrypted token
		await this.cache.set(cacheKey, encrypt(data.token), {
			ttlSeconds: TOKEN_CACHE_TTL_SECONDS,
		});

		return { token: data.token, expiresAt: data.expires_at };
	}

	// ==================================
	// ======== Internal helpers ========
	// ==================================

	private getPrivateKey(): KeyObject {
		if (!this.privateKey) {
			this.privateKey = createPrivateKey(this.config.appPrivateKey);
		}
		return this.privateKey;
	}

	private async createAppJWT(): Promise<string> {
		const key = this.getPrivateKey();
		return new SignJWT()
			.setProtectedHeader({ alg: "RS256" })
			.setIssuedAt(Math.floor(Date.now() / 1000) - 60)
			.setExpirationTime(Math.floor(Date.now() / 1000) + 600)
			.setIssuer(this.config.appId)
			.sign(key);
	}
}
