import { Ratelimit } from "@upstash/ratelimit";
import type { IRateLimiter } from "@/lib/server/interfaces";
import { redis } from "@/lib/server/redis/client";

// ==================================
// ========= Authentication =========
// ==================================

export const loginLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "10 m"),
});

export const signupLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(10, "1 h"),
});

export const githubOAuthStartLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(10, "1 m"),
});

export const changePasswordLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "10 m"),
});

export const forgotPasswordLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(3, "10 m"),
});

export const resetPasswordLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "10 m"),
});

// =============================================
// ========= Email code (passwordless) =========
// =============================================

export const emailCodeSendLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "10 m"),
});

export const emailCodeVerifyLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(10, "10 m"),
});

// =========================================
// ============= Refresh Token =============
// =========================================

export const refreshLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(20, "1 m"),
});

// =========================================
// ============= AI interactions ===========
// =========================================

export const aiLimiterPerMinute: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "1 m"),
});

export const aiLimiterPerMonth: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(30, "30 d"),
});

// ==================================
// ============= GitHub =============
// ==================================

export const githubRepoLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(30, "1 m"),
});

export const githubInstallLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(5, "1 m"),
});

export const githubCompareCommitsLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(15, "1 m"),
});

// =====================================
// ========= Email invitations =========
// =====================================

export const inviteEmailLimiter: IRateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.fixedWindow(10, "1 h"),
});
