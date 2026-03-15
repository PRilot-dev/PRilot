import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { refreshSession } from "@/lib/server/refreshSession";
import { setTokensInCookies } from "@/lib/server/token";

const PUBLIC_API_ROUTES = [
  "/api/auth/signup",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/github/start",
  "/api/auth/github/callback",
  "/api/auth/refresh",
  "/api/auth/email-code/send",
  "/api/auth/email-code/verify",
];

let encodedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (!encodedSecret) {
    encodedSecret = new TextEncoder().encode(process.env.JWT_SECRET);
  }
  return encodedSecret;
}

async function isValidJWT(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

function addSecurityHeaders(headers: Headers) {
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-XSS-Protection", "0");
  headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
}

function unauthorizedResponse(): NextResponse {
  const response = NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 },
  );
  addSecurityHeaders(response.headers);
  return response;
}

/**
 * Attempts to refresh the session using the refresh token cookie.
 * Returns the new tokens on success, or null on failure.
 */
async function tryRefresh(
  req: NextRequest,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const refreshToken = req.cookies.get("refreshToken")?.value;
  if (!refreshToken) return null;

  try {
    return await refreshSession(refreshToken);
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();

  // 1. Security headers on all responses
  addSecurityHeaders(response.headers);

  // 2. Auth check for protected API routes
  if (pathname.startsWith("/api/") && !PUBLIC_API_ROUTES.includes(pathname)) {
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken || !(await isValidJWT(accessToken))) {
      // Try server-side refresh before rejecting
      const tokens = await tryRefresh(req);
      if (tokens) {
        setTokensInCookies(response, tokens.accessToken, tokens.refreshToken);
        return response;
      }
      return unauthorizedResponse();
    }
  }

  // 3. Redirect unauthenticated users from dashboard to login
  if (pathname.startsWith("/dashboard")) {
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken || !(await isValidJWT(accessToken))) {
      // Try server-side refresh before redirecting
      const tokens = await tryRefresh(req);
      if (tokens) {
        setTokensInCookies(response, tokens.accessToken, tokens.refreshToken);
        return response;
      }
      const loginUrl = new URL("/login", req.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      addSecurityHeaders(redirectResponse.headers);
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
