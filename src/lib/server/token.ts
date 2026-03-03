import "server-only";

import crypto from "node:crypto";
import { errors, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { User } from "@/db";
import { getPrisma } from "@/db";
import { UnauthorizedError } from "@/lib/server/error";
import { config } from "./config";

export const ACCESS_TOKEN_DURATION_IN_MS = 60 * 60 * 1000; // 1h
export const REFRESH_TOKEN_DURATION_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7d

const secret = new TextEncoder().encode(config.jwt.secret);

const prisma = getPrisma();

// ----------------------------
// -------- Decode JWT --------
// ----------------------------
export async function decodeJWT(accessToken: string) {
  try {
    const { payload } = await jwtVerify(accessToken, secret);
    return payload;
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      throw new UnauthorizedError("Provided access token is expired");
    }
    if (
      error instanceof errors.JWTClaimValidationFailed ||
      error instanceof errors.JWSSignatureVerificationFailed
    ) {
      throw new UnauthorizedError("Provided access token is malformed");
    }

    console.error(error);
    throw new UnauthorizedError("JWT unknown error");
  }
}

// ---------------------------------
// ----- Generate access token -----
// ---------------------------------
export async function generateAccessToken(user: User) {
  return new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${ACCESS_TOKEN_DURATION_IN_MS / 1000}s`)
    .sign(secret);
}

// ----------------------------------
// ----- Generate refresh token -----
// ----------------------------------
export async function generateRefreshToken(user: User) {
  const refreshToken = crypto.randomBytes(64).toString("base64");

  // Clean up expired tokens for this user
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
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
  const accessToken = await generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  setTokensInCookies(res, accessToken, refreshToken);
}
