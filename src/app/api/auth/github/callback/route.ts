import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import z from "zod";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { BadRequestError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import type { IOAuthProvider } from "@/lib/server/interfaces";
import { oauthProvider } from "@/lib/server/providers/oauth";
import {
	generateAccessToken,
	generateRefreshToken,
	setTokensInCookies,
} from "@/lib/server/token";

interface Deps {
	prisma: PrismaClient;
	oauthProvider: IOAuthProvider;
}

const defaultDeps: Deps = { prisma, oauthProvider };

export function createPostHandler(deps: Deps = defaultDeps) {
	return async (req: Request) => {
		try {
			// 1. Parse and validate request body
			const bodySchema = z.object({
				code: z.string().optional(),
				state: z.string().optional(),
			});
			const { code, state } = await bodySchema.parseAsync(
				await req.json(),
			);
			if (!code || !state) {
				throw new BadRequestError("Missing code or state");
			}

			// 2. Validate CSRF state against cookie
			const cookieStore = await cookies();
			const storedState =
				cookieStore.get("github_oauth_state")?.value;
			if (!storedState || storedState !== state) {
				throw new BadRequestError("Invalid OAuth state");
			}

			// 3. Exchange code for access token + fetch user profile
			const safeCode = sanitizeHtml(code);
			const { accessToken: ghAccessToken } =
				await deps.oauthProvider.exchangeCodeForToken(safeCode);
			const ghUser =
				await deps.oauthProvider.getUserProfile(ghAccessToken);

			// 4. Find or create user
			let user = await deps.prisma.user.findFirst({
				where: {
					oauthIds: {
						some: {
							provider: "github",
							providerUserId: ghUser.providerUserId,
						},
					},
				},
				include: { oauthIds: true },
			});

			if (!user) {
				user = await deps.prisma.user.findUnique({
					where: { email: ghUser.email },
					include: { oauthIds: true },
				});

				if (user) {
					await deps.prisma.userOAuth.create({
						data: {
							userId: user.id,
							provider: "github",
							providerUserId: ghUser.providerUserId,
						},
					});
				}
			}

			if (!user) {
				user = await deps.prisma.user.create({
					data: {
						email: ghUser.email,
						username: ghUser.login,
						oauthIds: {
							create: {
								provider: "github",
								providerUserId: ghUser.providerUserId,
							},
						},
					},
					include: { oauthIds: true },
				});
			}

			// 5. Remove sensitive info
			const { password: _password, oauthIds, ...safeUser } = user;
			const oauthProviders = oauthIds.map((o) => o.provider);

			// 6. Create response with session
			const accessToken = await generateAccessToken(user);
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
	};
}

export const POST = createPostHandler();
