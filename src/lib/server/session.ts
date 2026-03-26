import type { PrismaClient } from "@/db";
import { prisma as defaultPrisma } from "@/db";
import { decodeJWT, extractAccessToken } from "./token";


export async function getCurrentUser(db: PrismaClient = defaultPrisma) {
  try {
    const token = await extractAccessToken();
    const payload = await decodeJWT(token);

    const userId = payload.userId as string;
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { oauthIds: true }, // include OAuth associations
    });

    if (!user) return null;

    // Remove password and map oauthIds
    const { password, oauthIds, ...safeUser } = user;
    const oauthProviders = oauthIds.map((o) => o.provider);

    return {
      ...safeUser,
      hasPassword: !!password,
      oauthProviders,
    };
  } catch {
    return null;
  }
}
