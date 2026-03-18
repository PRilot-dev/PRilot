/** OAuth token exchange result. */
export interface OAuthTokenResult {
	accessToken: string;
}

/** A user profile from an OAuth provider. */
export interface OAuthUserProfile {
	providerUserId: string;
	login: string;
	email: string;
}

/**
 * OAuth flow operations for a provider.
 * State/CSRF validation stays in the route handler.
 * Current implementation: GitHub OAuth.
 */
export interface IOAuthProvider {
	/** Exchange an authorization code for an access token. */
	exchangeCodeForToken(code: string): Promise<OAuthTokenResult>;

	/** Fetch the authenticated user's profile (including verified email). */
	getUserProfile(accessToken: string): Promise<OAuthUserProfile>;
}
