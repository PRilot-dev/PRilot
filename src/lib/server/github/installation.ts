import { getPrisma } from "@/db";
import { BadRequestError } from "@/lib/server/error";

/**
 * Verifies that a GitHub App installation is linked to the given user in the DB.
 */
export async function getUserInstallation(
	userId: string,
	installationId: string,
	prisma = getPrisma(),
) {
	const installation = await prisma.providerInstallation.findFirst({
		where: {
			provider: "github",
			installationId,
			createdById: userId,
		},
	});

	if (!installation) {
		throw new BadRequestError("Installation not linked to user");
	}

	return installation;
}
