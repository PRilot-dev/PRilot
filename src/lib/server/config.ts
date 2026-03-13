import { z } from "zod";

const envSchema = z.object({
	// Database
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

	// JWT
	JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

	// GitHub OAuth
	GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
	GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),

	// Frontend
	FRONTEND_URL: z.url("FRONTEND_URL must be a valid URL"),

	// GitHub App
	GITHUB_APP_ID: z.string().min(1, "GITHUB_APP_ID is required"),
	GITHUB_APP_PRIVATE_KEY: z
		.string()
		.min(1, "GITHUB_APP_PRIVATE_KEY is required"),

	// Groq
	GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),

	// Resend
	RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),

	// Redis (Upstash)
	UPSTASH_REDIS_REST_URL: z
		.string()
		.min(1, "UPSTASH_REDIS_REST_URL is required"),
	UPSTASH_REDIS_REST_TOKEN: z
		.string()
		.min(1, "UPSTASH_REDIS_REST_TOKEN is required"),

	// Domain Name
	DOMAIN_NAME: z.string().min(1, "DOMAIN_NAME is required"),

	// App Name
	APP_NAME: z.string().min(1, "APP_NAME is required"),

	// Logo Url
	LOGO_URL: z.string().min(1, "LOGO_URL is required"),

	// Node environment
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
});

const parsedEnv = envSchema.parse(process.env);

export const config = {
	db: {
		url: parsedEnv.DATABASE_URL,
	},
	jwt: {
		secret: parsedEnv.JWT_SECRET,
	},
	github: {
		clientId: parsedEnv.GITHUB_CLIENT_ID,
		clientSecret: parsedEnv.GITHUB_CLIENT_SECRET,
		oauthRedirectUri: `${parsedEnv.FRONTEND_URL}/api/auth/github/callback`,
		appId: parsedEnv.GITHUB_APP_ID,
		appPrivateKey: parsedEnv.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
		redirectUri: `${parsedEnv.FRONTEND_URL}/login/github/callback`,
	},
	groq: {
		apiKey: parsedEnv.GROQ_API_KEY,
	},
	resend: {
		apiKey: parsedEnv.RESEND_API_KEY,
	},
	redis: {
		restUrl: parsedEnv.UPSTASH_REDIS_REST_URL,
		restToken: parsedEnv.UPSTASH_REDIS_REST_TOKEN,
	},
	domainName: parsedEnv.DOMAIN_NAME,
	appName: parsedEnv.APP_NAME,
	logoUrl: parsedEnv.LOGO_URL,
	frontendUrl: parsedEnv.FRONTEND_URL,
	nodeEnv: parsedEnv.NODE_ENV,
};
