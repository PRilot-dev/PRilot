"use client";

import {
	type CollisionDetection,
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	pointerWithin,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Loader2, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import { Button } from "@/components/buttons/Button";
import { BlockCard } from "@/components/ui/BlockCard";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/Card";
import { BRANCH_TYPES, useBlockConfig } from "@/hooks/useBlockConfig";
import { useRepository } from "@/hooks/useRepository";

export default function RepoSettingsPage() {
	const params = useParams();
	const repoId = params.id as string;
	const { repo, loading: repoLoading } = useRepository(repoId);

	const {
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
	} = useBlockConfig(repoId);

	const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
	const activeBlock = activeBlockId
		? activeConfig.find((rb) => rb.block.id === activeBlockId)
		: null;

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
	);

	// If pointer is within the sortable container, use closestCenter for reordering.
	// If pointer is outside, return no collisions so `over` is null → triggers removal.
	const collisionDetection: CollisionDetection = (args) => {
		const within = pointerWithin(args);
		if (within.length > 0) return closestCenter(args);
		return [];
	};

	function handleDragStart(event: DragStartEvent) {
		setActiveBlockId(event.active.id as string);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		setActiveBlockId(null);

		// Dropped outside the list — remove the block
		if (!over) {
			removeBlock(active.id as string);
			return;
		}

		if (active.id === over.id) return;

		const oldIndex = activeConfig.findIndex((rb) => rb.block.id === active.id);
		const newIndex = activeConfig.findIndex((rb) => rb.block.id === over.id);
		reorderBlocks(oldIndex, newIndex);
	}

	// ---- Render ----

	if (repoLoading || loading) {
		return (
			<div className="p-6 flex items-center justify-center min-h-[50vh]">
				<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
			</div>
		);
	}

	if (!repo) return null;

	return (
		<div className="p-6 flex flex-col gap-6 fade-in-fast">
			{/* ---- Header ---- */}
			<AnimatedSlide x={-20} triggerOnView={false}>
				<h1 className="text-3xl text-gray-900 dark:text-white">
					Settings
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-1">
					Configure PR templates for {repo.name}
				</p>
			</AnimatedSlide>

			{/* ---- Branch type selector ---- */}
			<Card>
				<CardHeader>
					<CardTitle>PR Template</CardTitle>
					<CardDescription>
						Choose which blocks appear in generated PRs. You can
						configure different templates per branch type.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{BRANCH_TYPES.map((type) => {
							const isActive = activeBranchType === type;
							const hasConfig = repoBlocks.some(
								(rb) => rb.branchType === type,
							);
							return (
								<button
									key={type}
									type="button"
									onClick={() => setActiveBranchType(type)}
									className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
										${
											isActive
												? "bg-gray-900 text-white dark:bg-gray-200 dark:text-black"
												: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
										}`}
								>
									{type}
									{hasConfig && !isActive && (
										<span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
									)}
								</button>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* ---- Active blocks ---- */}
			<Card>
				<CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<CardTitle>
							Active blocks
							<span className="ml-2 text-sm font-normal text-gray-500">
								({activeBranchType})
							</span>
						</CardTitle>
						<CardDescription>
							{activeBranchType === "default"
								? "Used when no branch-specific template is configured"
								: `Used for branches starting with "${activeBranchType}/"`}
						</CardDescription>
					</div>
					<Button
						onClick={save}
						disabled={saving}
						className="w-full sm:w-24 bg-gray-900 text-white dark:bg-gray-200 dark:text-black hover:bg-gray-700 dark:hover:bg-gray-400"
					>
						{saving ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<>
								<Save className="h-4 w-4 mr-1.5" />
								Save
							</>
						)}
					</Button>
				</CardHeader>
				<CardContent>
					{activeConfig.length === 0 ? (
						<p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
							{activeBranchType === "default"
								? "No blocks configured. The system default (Summary + Changes + How to Test) will be used."
								: `No blocks configured for "${activeBranchType}". The default template will be used as fallback.`}
						</p>
					) : (
						<DndContext
							sensors={sensors}
							collisionDetection={collisionDetection}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
						>
							<SortableContext
								items={activeConfig.map((rb) => rb.block.id)}
								strategy={verticalListSortingStrategy}
							>
								<div className="flex flex-col gap-2">
									{activeConfig.map((rb) => (
										<BlockCard
											key={rb.blockId}
											variant="active"
											block={rb.block}
											detailLevel={rb.detailLevel}
											onDetailLevelChange={updateDetailLevel}
											onRemove={removeBlock}
										/>
									))}
								</div>
							</SortableContext>
							<DragOverlay>
								{activeBlock ? (
									<div className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl opacity-90">
										<p className="font-medium text-sm">{activeBlock.block.name}</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">{activeBlock.block.description}</p>
									</div>
								) : null}
							</DragOverlay>
						</DndContext>
					)}
				</CardContent>
			</Card>

			{/* ---- Available blocks to add ---- */}
			{availableBlocks.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Available blocks</CardTitle>
						<CardDescription>
							Click to add a block to the template
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-2 sm:grid-cols-2">
							{availableBlocks.map((block) => (
								<BlockCard
									key={block.id}
									variant="available"
									block={block}
									onAdd={addBlock}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
