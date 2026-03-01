import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./client";

// ---- Auth ----
export const loginLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "10 m"),
});

export const signupLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(10, "1 h"),
});

// GitHub OAuth start route
export const githubOAuthStartLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(10, "1 m"),
});

export const changePasswordLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "10 m"),
});

export const forgotPasswordLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(3, "10 m"),
});

export const resetPasswordLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "10 m"),
});

// Email code (passwordless)
export const emailCodeSendLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "10 m"),
});

export const emailCodeVerifyLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(10, "10 m"),
});

// Refresh Token
export const refreshLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(20, "1 m"),
});

// ---- AI ----
export const aiLimiterPerMinute = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "1 m"),
});

export const aiLimiterPerMonth = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(30, "30 d"),
});

// ---- GitHub ----
export const githubRepoLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(30, "1 m"),
});

export const githubInstallLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "1 m"),
});

export const githubCompareCommitsLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(15, "1 m"),
});

// ---- Email ----
export const inviteEmailLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(10, "1 h"),
});
