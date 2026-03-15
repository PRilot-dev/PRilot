import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/repos/route";
import { getCurrentUser } from "@/lib/server/session";
import { testPrisma } from "@/tests/db";
import { seedPullRequest, seedRepo } from "@/tests/helpers/repo";
import { parseJson } from "@/tests/helpers/request";
import { mockUser, seedUser } from "@/tests/helpers/user";

describe("GET /api/repos", () => {

	it("returns 200 with the user's repositories", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });

		// ACT
		const res = await GET();
		const data = await parseJson<{ repositories: { id: string; name: string }[] }>(res);

		// ASSERT
		expect(res.status).toBe(200);
		expect(data.repositories).toHaveLength(1);
		expect(data.repositories[0]).toMatchObject({
			id: repository.id,
			name: "test-repo",
			userRole: "owner",
		});
	});

	it("includes draft and sent PR counts", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		const { repository } = await seedRepo({ userId: user.id });
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { status: "draft" } });
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { status: "draft" } });
		await seedPullRequest({ repositoryId: repository.id, createdById: user.id, overrides: { status: "sent" } });

		// ACT
		const res = await GET();
		const data = await parseJson<{
			repositories: { draftPrCount: number; sentPrCount: number }[];
		}>(res);

		// ASSERT
		expect(data.repositories[0].draftPrCount).toBe(2);
		expect(data.repositories[0].sentPrCount).toBe(1);
	});

	it("excludes deleted repositories", async () => {
		// ARRANGE
		const user = await seedUser();
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		await seedRepo({ userId: user.id, repoOverrides: { status: "deleted", name: "deleted-repo" } });
		await seedRepo({ userId: user.id, repoOverrides: { name: "active-repo" } });

		// ACT
		const res = await GET();
		const data = await parseJson<{ repositories: { name: string }[] }>(res);

		// ASSERT
		expect(data.repositories).toHaveLength(1);
		expect(data.repositories[0].name).toBe("active-repo");
	});

	it("excludes repositories the user is not a member of", async () => {
		// ARRANGE
		const user = await seedUser();
		const other = await seedUser("other@example.com", "otheruser");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser({ id: user.id }));
		await seedRepo({ userId: other.id, repoOverrides: { name: "not-mine" } });

		// ACT
		const res = await GET();
		const data = await parseJson<{ repositories: unknown[] }>(res);

		// ASSERT
		expect(data.repositories).toHaveLength(0);
	});

	it("includes pending invitations for the user", async () => {
		// ARRANGE
		const user = await seedUser();
		const inviter = await seedUser("inviter@example.com", "inviter");
		vi.mocked(getCurrentUser).mockResolvedValueOnce(
			mockUser({ id: user.id, email: user.email }),
		);
		const { repository } = await seedRepo({ userId: inviter.id });
		await testPrisma.invitation.create({
			data: {
				repositoryId: repository.id,
				email: user.email,
				invitedById: inviter.id,
				token: "invite-token-123",
				status: "pending",
				expiresAt: new Date(Date.now() + 86_400_000),
			},
		});

		// ACT
		const res = await GET();
		const data = await parseJson<{
			invitations: { token: string; repositoryName: string; invitedBy: string }[];
		}>(res);

		// ASSERT
		expect(data.invitations).toHaveLength(1);
		expect(data.invitations[0]).toMatchObject({
			token: "invite-token-123",
			repositoryName: "test-repo",
			invitedBy: "inviter",
		});
	});

	it("returns 401 when unauthenticated", async () => {
		// ACT
		const res = await GET();
		const data = await parseJson(res);

		// ASSERT
		expect(res.status).toBe(401);
		expect(data).toMatchObject({ error: "Unauthenticated" });
	});
});
