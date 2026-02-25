import "server-only";

import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import crypto from "node:crypto";
import { config } from "./config";
import { UnauthorizedError } from "@/lib/server/error";
import { getPrisma } from "@/db";
import type { User } from "@/db";

export const ACCESS_TOKEN_DURATION_IN_MS = 60 * 60 * 1000; // 1h
export const REFRESH_TOKEN_DURATION_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7d

const prisma = getPrisma();

// ----------------------------
// -------- Decode JWT --------
// ----------------------------
export function decodeJWT(accessToken: string): JwtPayload {
	try {
		return jwt.verify(accessToken, config.jwt.secret) as JwtPayload;
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			throw new UnauthorizedError("Provided access token is expired");
		}
		if (error instanceof jwt.JsonWebTokenError) {
			throw new UnauthorizedError("Provided access token is malformed");
		}

		console.error(error);
		throw new UnauthorizedError("JWT unknown error");
	}
}

// ---------------------------------
// ----- Generate access token -----
// ---------------------------------
export function generateAccessToken(user: User) {
	return jwt.sign({ userId: user.id }, config.jwt.secret, {
		expiresIn: ACCESS_TOKEN_DURATION_IN_MS / 1000,
	});
}

// ----------------------------------
// ----- Generate refresh token -----
// ----------------------------------
export async function generateRefreshToken(user: User) {
	const refreshToken = crypto.randomBytes(64).toString("base64");

	await prisma.refreshToken.deleteMany({
		where: { userId: user.id },
	});

	await prisma.refreshToken.create({
		data: {
			userId: user.id,
			token: refreshToken,
			expiresAt: new Date(Date.now() + REFRESH_TOKEN_DURATION_IN_MS),
		},
	});

	return refreshToken;
}

// -----------------------------------
// -- Extract access token from req --
// -----------------------------------
export async function extractAccessToken() {
	const cookieStore = await cookies();

	const token = cookieStore.get("accessToken")?.value;
	if (token) return token;

	throw new UnauthorizedError("Access token not provided");
}

// -------------------------------
// ---- Set tokens in cookies ----
// -------------------------------
export function setTokensInCookies(
	res: NextResponse,
	accessToken: string,
	refreshToken: string,
) {
	const isProd = process.env.NODE_ENV === "production";

	res.cookies.set("accessToken", accessToken, {
		httpOnly: true,
		maxAge: ACCESS_TOKEN_DURATION_IN_MS / 1000,
		sameSite: "lax",
		secure: isProd,
		path: "/",
	});

	res.cookies.set("refreshToken", refreshToken, {
		httpOnly: true,
		maxAge: REFRESH_TOKEN_DURATION_IN_MS / 1000,
		sameSite: "lax",
		secure: isProd,
		path: "/",
	});
}

// ----------------------------
// ----- Create session -------
// ----------------------------
export async function createSession(res: NextResponse, user: User) {
	const accessToken = generateAccessToken(user);
	const refreshToken = await generateRefreshToken(user);

	setTokensInCookies(res, accessToken, refreshToken);
}
