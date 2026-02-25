import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fetch from "node-fetch";
import sanitizeHtml from "sanitize-html";
import z from "zod";
import { getPrisma } from "@/db";
import { config } from "@/lib/server/config";
import { handleError } from "@/lib/server/handleError";
import {
	generateAccessToken,
	generateRefreshToken,
	setTokensInCookies,
} from "@/lib/server/token";

const prisma = getPrisma();

type GitHubTokenResponse = {
	access_token?: string;
	token_type?: string;
	scope?: string;
	error?: string;
	error_description?: string;
};

type GitHubUser = {
	id?: number;
	login?: string;
	email?: string | null;
};

export async function POST(req: Request) {
	try {
		// 1. Parse and validate request body
		const bodySchema = z.object({
			code: z.string().optional(),
			state: z.string().optional(),
		});
		const { code, state } = await bodySchema.parseAsync(await req.json());
		if (!code || !state) {
			return NextResponse.json({
				success: false,
				message: "Missing code or state",
			});
		}

		// 2. Validate CSRF state against cookie
		const cookieStore = await cookies();
		const storedState = cookieStore.get("github_oauth_state")?.value;
		if (!storedState || storedState !== state) {
			return NextResponse.json(
				{ success: false, message: "Invalid OAuth state" },
				{ status: 403 },
			);
		}

		// 3. Exchange code for GitHub access token
		const safeCode = sanitizeHtml(code);
		const tokenRes = await fetch(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: { Accept: "application/json" },
				body: new URLSearchParams({
					client_id: config.github.clientId,
					client_secret: config.github.clientSecret,
					code: safeCode,
				}),
			},
		);
		const tokenData = (await tokenRes.json()) as GitHubTokenResponse;
		if (!tokenData.access_token) {
			return NextResponse.json({
				success: false,
				message: "Failed to get access token",
			});
		}

		// 4. Fetch GitHub user profile
		const ghUserRes = await fetch("https://api.github.com/user", {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
		});
		const ghUser = (await ghUserRes.json()) as GitHubUser;

		// 5. Resolve email (fetch from /user/emails if private)
		let email = ghUser.email;
		if (!email) {
			const ghEmailsRes = await fetch("https://api.github.com/user/emails", {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});

			if (!ghEmailsRes.ok) {
				return NextResponse.json({
					success: false,
					message: "Failed to fetch GitHub emails",
				});
			}

			const emailsData = await ghEmailsRes.json();
			const emails = Array.isArray(emailsData) ? emailsData : [];

			const primaryEmail = emails.find(
				(e: any) => e.primary && e.verified && typeof e.email === "string",
			)?.email;

			if (!primaryEmail) {
				return NextResponse.json({
					success: false,
					message: "No verified GitHub email found",
				});
			}

			email = primaryEmail;
		}

		// 6. Validate essential GitHub user info
		if (!ghUser.id || !ghUser.login || !email) {
			return NextResponse.json({
				success: false,
				message: "Failed to get GitHub user info",
			});
		}

		// 7. Find or create user
		let user = await prisma.user.findFirst({
			where: {
				oauthIds: {
					some: { provider: "github", providerUserId: ghUser.id.toString() },
				},
			},
			include: { oauthIds: true },
		});

		if (!user) {
			user = await prisma.user.findUnique({
				where: { email },
				include: { oauthIds: true },
			});

			if (user) {
				await prisma.userOAuth.create({
					data: {
						userId: user.id,
						provider: "github",
						providerUserId: ghUser.id.toString(),
					},
				});
			}
		}

		if (!user) {
			user = await prisma.user.create({
				data: {
					email,
					username: ghUser.login,
					oauthIds: {
						create: {
							provider: "github",
							providerUserId: ghUser.id.toString(),
						},
					},
				},
				include: { oauthIds: true },
			});
		}

		// 8. Remove sensitive info
		const { password: _password, oauthIds, ...safeUser } = user;
		const oauthProviders = oauthIds.map((o) => o.provider);

		// 9. Create response with session
		const accessToken = generateAccessToken(user);
		const refreshToken = await generateRefreshToken(user);

		const res = NextResponse.json({
			success: true,
			message: "GitHub connected successfully",
			user: {
				...safeUser,
				oauthProviders,
			},
		});

		setTokensInCookies(res, accessToken, refreshToken);
		res.cookies.delete("github_oauth_state");

		return res;
	} catch (error) {
		return handleError(error);
	}
}
