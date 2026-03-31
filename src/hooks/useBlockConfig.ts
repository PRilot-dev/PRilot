import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// ---- Types ----

export interface Block {
	id: string;
	slug: string;
	name: string;
	description: string;
}

export interface RepositoryBlock {
	id: string;
	blockId: string;
	branchType: string;
	position: number;
	detailLevel: number;
	block: Block;
}

interface BlockConfig {
	blockId: string;
	position: number;
	detailLevel: number;
}

export const BRANCH_TYPES = ["default", "feat", "fix", "chore", "refactor", "docs"];

// ---- Hook ----

export function useBlockConfig(repoId: string) {
	const [allBlocks, setAllBlocks] = useState<Block[]>([]);
	const [repoBlocks, setRepoBlocks] = useState<RepositoryBlock[]>([]);
	const [activeBranchType, setActiveBranchType] = useState("default");
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(true);

	// Active config for the selected branch type
	const activeConfig = repoBlocks
		.filter((rb) => rb.branchType === activeBranchType)
		.sort((a, b) => a.position - b.position);

	// Blocks not yet added to the active config
	const availableBlocks = allBlocks.filter(
		(b) => !activeConfig.some((rb) => rb.blockId === b.id),
	);

	// ---- Fetch ----

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const [blocksRes, repoBlocksRes] = await Promise.all([
				fetchWithAuth("/api/blocks"),
				fetchWithAuth(`/api/repos/${repoId}/blocks`),
			]);

			if (!blocksRes.ok || !repoBlocksRes.ok) {
				throw new Error("Failed to fetch block configuration");
			}

			const blocksData = await blocksRes.json();
			const repoBlocksData = await repoBlocksRes.json();

			setAllBlocks(blocksData.blocks);
			setRepoBlocks(repoBlocksData.repositoryBlocks);
		} catch {
			toast.error("Failed to load settings");
		} finally {
			setLoading(false);
		}
	}, [repoId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// ---- Actions ----

	function addBlock(block: Block) {
		const newRB: RepositoryBlock = {
			id: `temp-${block.id}`,
			blockId: block.id,
			branchType: activeBranchType,
			position: activeConfig.length,
			detailLevel: 2,
			block,
		};
		setRepoBlocks((prev) => [...prev, newRB]);
	}

	function removeBlock(blockId: string) {
		setRepoBlocks((prev) =>
			prev.filter(
				(rb) =>
					!(
						rb.blockId === blockId &&
						rb.branchType === activeBranchType
					),
			),
		);
	}

	function updateDetailLevel(blockId: string, detailLevel: number) {
		setRepoBlocks((prev) =>
			prev.map((rb) =>
				rb.blockId === blockId && rb.branchType === activeBranchType
					? { ...rb, detailLevel }
					: rb,
			),
		);
	}

	function reorderBlocks(oldIndex: number, newIndex: number) {
		if (oldIndex === newIndex) return;

		const sorted = [...activeConfig];
		const [moved] = sorted.splice(oldIndex, 1);
		sorted.splice(newIndex, 0, moved);

		const updatedBlockIds = new Set(
			sorted.map((rb) => `${rb.blockId}-${activeBranchType}`),
		);
		setRepoBlocks((prev) => [
			...prev.filter(
				(rb) =>
					!updatedBlockIds.has(`${rb.blockId}-${rb.branchType}`),
			),
			...sorted.map((rb, i) => ({ ...rb, position: i })),
		]);
	}

	async function save() {
		setSaving(true);
		try {
			const blocks: BlockConfig[] = activeConfig.map((rb, i) => ({
				blockId: rb.blockId,
				position: i,
				detailLevel: rb.detailLevel,
			}));

			const res = await fetchWithAuth(`/api/repos/${repoId}/blocks`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					branchType: activeBranchType,
					blocks,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to save");
			}

			const data = await res.json();
			setRepoBlocks((prev) => [
				...prev.filter((rb) => rb.branchType !== activeBranchType),
				...data.repositoryBlocks,
			]);

			toast.success(`Template saved for "${activeBranchType}" branches`);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to save template",
			);
		} finally {
			setSaving(false);
		}
	}

	return {
		loading,
		saving,
		activeBranchType,
		setActiveBranchType,
		activeConfig,
		availableBlocks,
		repoBlocks,
		addBlock,
		removeBlock,
		updateDetailLevel,
		reorderBlocks,
		save,
	};
}
