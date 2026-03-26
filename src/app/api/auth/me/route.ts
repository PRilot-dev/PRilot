import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

interface Deps {
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { getCurrentUser: defaultGetCurrentUser };

export function createGetHandler(deps: Deps = defaultDeps) {
	return async () => {
		try {
			const user = await deps.getCurrentUser();

			if (!user) {
				throw new UnauthorizedError("Unauthenticated");
			}

			return NextResponse.json(user);
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
