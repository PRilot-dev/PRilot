import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { usePullRequestActions } from "@/hooks/usePullRequestActions";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { parsePartialPRJson } from "@/lib/utils/parsePartialPRJson";
import { useCreditsStore } from "@/stores/creditsStore";

interface GeneratePRResponse {
	title: string;
	description: string;
	rateLimit?: {
		weeklyRemaining: number;
		weeklyReset: number;
	};
}

interface useGeneratePRProps {
	repoId: string;
	prId: string | null;
	baseBranch: string;
	compareBranch: string;
	language: string;
	mode: "fast" | "deep";
	setPrId: (id: string) => void;
}

function normalizeDescription(desc: string | { description: string }): string {
	if (typeof desc === "string") return desc;
	if (desc && typeof desc.description === "string") return desc.description;
	return "";
}

export function useGeneratePR({
	repoId,
	prId,
	baseBranch,
	compareBranch,
	language,
	mode,
	setPrId,
}: useGeneratePRProps) {
	const { addDraftPR } = usePullRequestActions(repoId ?? "");
	const { setCredits } = useCreditsStore();

	const [isGenerating, setIsGenerating] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Streaming data: written by async loop
	const [streamingTitle, setStreamingTitle] = useState("");
	const [streamingDescription, setStreamingDescription] = useState("");

	// Abort on unmount
	useEffect(() => {
		return () => {
			abortControllerRef.current?.abort();
		};
	}, []);

	const generatePR = useCallback(async () => {
		if (!compareBranch) throw new Error("Compare branch is needed");
		setIsGenerating(true);

		abortControllerRef.current?.abort();
		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		try {
			const aiRes = await fetchWithAuth(
				`/api/repos/${repoId}/pull-requests/generate/${mode}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ language, baseBranch, compareBranch }),
					signal: abortController.signal,
				},
			);

			if (!aiRes.ok) {
				const data = await aiRes.json();
				toast.error(data.error || "Failed to generate PR");
				return { success: false };
			}

			if (!aiRes.body) {
				toast.error("Failed to read response stream");
				return { success: false };
			}

			const reader = aiRes.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let accumulated = "";
			let finalResult: GeneratePRResponse | null = null;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const parts = buffer.split("\n\n");
				buffer = parts.pop() ?? "";

				for (const block of parts) {
					if (!block.trim()) continue;

					let event = "";
					let dataStr = "";
					for (const line of block.split("\n")) {
						if (line.startsWith("event: "))
							event = line.slice(7);
						else if (line.startsWith("data: "))
							dataStr = line.slice(6);
					}
					if (!event || !dataStr) continue;

					const data = JSON.parse(dataStr);

					switch (event) {
						case "token": {
							accumulated += data.token;
							const { title, description } = parsePartialPRJson(accumulated);
							setStreamingDescription(description);
							setStreamingTitle(title);
							break;
						}
						case "retry":
							accumulated = "";
							setStreamingTitle("");
							setStreamingDescription("");
							break;
						case "done":
							finalResult = data as GeneratePRResponse;
							break;
						case "error":
							toast.error(
								data.message ||
									"Failed to generate PR",
							);
							return { success: false };
					}
				}
			}

			if (!finalResult) {
				toast.error("Stream ended without a result");
				return { success: false };
			}

			const title = finalResult.title;
			const safeDescription = normalizeDescription(
				finalResult.description,
			);

			// Save to DB
			if (!prId) {
				const newPR = await addDraftPR({
					prTitle: title,
					prBody: safeDescription,
					baseBranch,
					compareBranch,
					language,
					mode,
				});
				if (newPR) setPrId(newPR.id);
			} else {
				const updateRes = await fetchWithAuth(
					`/api/repos/${repoId}/pull-requests/${prId}`,
					{
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							prTitle: title,
							prBody: safeDescription,
							baseBranch,
							compareBranch,
							language,
							mode,
						}),
					},
				);
				if (!updateRes.ok) throw new Error("Failed to update PR");
			}

			// Sync credits locally — rateLimit is only returned when the current user is the repo owner
			if (finalResult.rateLimit) {
				setCredits({
					remaining: finalResult.rateLimit.weeklyRemaining,
					total: 20,
					reset: finalResult.rateLimit.weeklyReset,
				});
			}

		return { success: true, title, description: safeDescription };
		} catch (err) {
			if ((err as Error).name === "AbortError") {
				return { success: false };
			}
			console.error(err);
			toast.error("Failed to generate PR");
			return { success: false };
		} finally {
			setIsGenerating(false);
			if (abortControllerRef.current === abortController) {
				abortControllerRef.current = null;
			}
		}
	}, [repoId, addDraftPR, baseBranch, compareBranch, mode, language, prId, setPrId, setCredits]);

	return { isGenerating, generatePR, streamingTitle, streamingDescription };
}
