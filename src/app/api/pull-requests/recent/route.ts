import { type NextRequest, NextResponse } from "next/server";
import type { PrismaClient } from "@/db";
import { prisma } from "@/db";
import { UnauthorizedError } from "@/lib/server/error";
import { handleError } from "@/lib/server/handleError";
import { getCurrentUser as defaultGetCurrentUser } from "@/lib/server/session";

interface Deps {
	prisma: PrismaClient;
	getCurrentUser: typeof defaultGetCurrentUser;
}

const defaultDeps: Deps = { prisma, getCurrentUser: defaultGetCurrentUser };

export function createGetHandler(deps: Deps = defaultDeps) {
	return async (_req: NextRequest) => {
		try {
			// 1. Auth
			const user = await deps.getCurrentUser();
			if (!user) throw new UnauthorizedError("Unauthenticated");

			// 2. Calculate start dates for this week and previous week
			const now = new Date();
			const startOfWeek = (date: Date) => {
				const d = new Date(date);
				const day = d.getDay() || 7;
				if (day !== 1) d.setHours(-24 * (day - 1));
				d.setHours(0, 0, 0, 0);
				return d;
			};

			const startThisWeek = startOfWeek(now);
			const startLastWeek = new Date(startThisWeek);
			startLastWeek.setDate(startLastWeek.getDate() - 7);

			// 3. Fetch last 3 PRs and PR counts for this week and previous week
			const [recentPRs, thisWeekCount, lastWeekCount] = await Promise.all([
				deps.prisma.pullRequest.findMany({
					where: {
						createdById: user.id,
						repository: {
							status: { not: "deleted" },
							members: {
								some: { userId: user.id }, // user must still be a member or the repo
							},
						},
					},
					orderBy: { updatedAt: "desc" },
					take: 3,
					select: {
						id: true,
						title: true,
						status: true,
						baseBranch: true,
						compareBranch: true,
						updatedAt: true,
						providerPrUrl: true,
						mode: true,
						repository: {
							select: {
								id: true,
								name: true,
								provider: true,
							},
						},
					},
				}),
				deps.prisma.pullRequest.count({
					where: {
						createdById: user.id,
						status: "sent",
						updatedAt: { gte: startThisWeek },
					},
				}),
				deps.prisma.pullRequest.count({
					where: {
						createdById: user.id,
						status: "sent",
						updatedAt: {
							gte: startLastWeek,
							lt: startThisWeek,
						},
					},
				}),
			]);

			// 4. Map repository fields to provider + repoName
			const mappedPRs = recentPRs.map((pr) => ({
				id: pr.id,
				title: pr.title,
				status: pr.status,
				baseBranch: pr.baseBranch,
				compareBranch: pr.compareBranch,
				updatedAt: pr.updatedAt,
				providerPrUrl: pr.providerPrUrl,
				repoName: pr.repository.name,
				repoId: pr.repository.id,
				provider: pr.repository.provider,
			}));

			// 5. Return mapped PRs and weekly counts
			return NextResponse.json({
				recentPRs: mappedPRs,
				stats: {
					thisWeek: thisWeekCount,
					lastWeek: lastWeekCount,
				},
			});
		} catch (error) {
			return handleError(error);
		}
	};
}

export const GET = createGetHandler();
