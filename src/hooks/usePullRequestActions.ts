import { toast } from "react-toastify";
import { useRepos } from "@/contexts/ReposContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useRepoStore } from "@/stores/repoStore";

interface CreatePRPayload {
	prTitle: string;
	prBody: string;
	baseBranch: string;
	compareBranch: string;
	language: string;
	mode: "fast" | "deep";
}

export function usePullRequestActions(repoId: string) {
	const { updateGlobalDraftPrCount, updateGlobalSentPrCount } = useRepos();
	const repo = useRepoStore((s) => s.repos[repoId]);
	const updateDraftPrCount = useRepoStore((s) => s.updateDraftPrCount);
	const updateSentPrCount = useRepoStore((s) => s.updateSentPrCount);

	// ---- Add a PR ----
	const addDraftPR = async (payload: CreatePRPayload) => {
		if (!repo) return null;

		const res = await fetchWithAuth(`/api/repos/${repo.id}/pull-requests/draft`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			toast.error("Failed to create pull request");
			return null;
		}

		updateDraftPrCount(repoId, +1);				// Update local repo draft PR count
		updateGlobalDraftPrCount(repoId, +1); // Update local repos (dashboard) draft PR count

		return res.json();
	};

	// ---- Delete a PR ----
	const deleteDraftPR = async (prId: string) => {
		if (!repo) return;

		const res = await fetchWithAuth(`/api/repos/${repo.id}/pull-requests/${prId}`, {
			method: "DELETE",
		});

		if (!res.ok) {
			toast.error("Failed to delete pull request");
			return;
		}

		updateDraftPrCount(repo.id, -1); // Update local repo draft PR count

		updateGlobalDraftPrCount(repoId, -1); // Update local repos (dashboard) draft PR count

		toast.success("Pull request deleted 🗑️");
	};

	// ---- Mark a PR as sent (update counts) ----
	const addSentPR = () => {
		updateDraftPrCount(repoId, -1);
		updateSentPrCount(repoId, +1);
		updateGlobalDraftPrCount(repoId, -1);
		updateGlobalSentPrCount(repoId, +1);
	};

	return { addDraftPR, deleteDraftPR, addSentPR };
}
