import { vi } from "vitest";

// Config — avoids the Zod parse of real process.env for external services.
// db.url is intentionally kept pointing to the test database.
vi.mock("@/lib/server/config", () => ({
	config: {
		db: { url: "postgresql://postgres:postgres@localhost:5433/prilot_test" },
		jwt: { secret: "test-jwt-secret-that-is-at-least-32-chars!!" },
		github: {
			clientId: "test-github-client-id",
			clientSecret: "test-github-client-secret",
			oauthRedirectUri: "http://localhost:3000/api/auth/github/callback",
			appId: "12345",
			appPrivateKey:
				"-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAtest\n-----END RSA PRIVATE KEY-----",
			redirectUri: "http://localhost:3000/login/github/callback",
		},
		cerebras: { apiKey: "test-cerebras-api-key" },
		resend: { apiKey: "test-resend-api-key" },
		redis: {
			restUrl: "https://test.upstash.io",
			restToken: "test-upstash-token",
		},
		domainName: "localhost",
		appName: "PRilot Test",
		logoUrl: "http://localhost:3000/logo.png",
		frontendUrl: "http://localhost:3000",
		nodeEnv: "test",
	},
}));
