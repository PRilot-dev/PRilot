import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

// ---- Types ----

interface Block {
	id: string;
	slug: string;
	name: string;
	description: string;
}

const DETAIL_LABELS: Record<number, string> = {
	1: "Concise",
	2: "Standard",
	3: "Detailed",
};

// ---- Active variant ----

interface ActiveProps {
	variant: "active";
	block: Block;
	detailLevel: number;
	onDetailLevelChange: (blockId: string, level: number) => void;
	onRemove: (blockId: string) => void;
}

// ---- Available variant ----

interface AvailableProps {
	variant: "available";
	block: Block;
	onAdd: (block: Block) => void;
}

type BlockCardProps = ActiveProps | AvailableProps;

// ---- Component ----

export function BlockCard(props: BlockCardProps) {
	if (props.variant === "available") {
		return <AvailableBlockCard {...props} />;
	}

	return <ActiveBlockCard {...props} />;
}

// ---- Active block (sortable) ----

function ActiveBlockCard({ block, detailLevel, onDetailLevelChange, onRemove }: ActiveProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: block.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50
				${isDragging ? "opacity-50 shadow-lg z-10" : ""}`}
		>
			{/* Top row: drag handle + block info */}
			<div className="flex items-center gap-3 flex-1 min-w-0">
				{/* Drag handle */}
				<button
					type="button"
					className="touch-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
					{...attributes}
					{...listeners}
				>
					<GripVertical className="h-4 w-4" />
				</button>

				{/* Block info */}
				<div className="flex-1 min-w-0">
					<p className="font-medium text-sm">{block.name}</p>
					<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
						{block.description}
					</p>
				</div>
			</div>

			{/* Bottom row on mobile: detail level + remove */}
			<div className="flex items-center justify-between sm:justify-end gap-3">
				{/* Detail level */}
				<div className="flex gap-1">
					{[1, 2, 3].map((level) => (
						<button
							key={level}
							type="button"
							onClick={() => onDetailLevelChange(block.id, level)}
							className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer
								${
									detailLevel === level
										? "bg-gray-900 text-white dark:bg-gray-200 dark:text-black"
										: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
								}`}
						>
							{DETAIL_LABELS[level]}
						</button>
					))}
				</div>

				{/* Remove */}
				<button
					type="button"
					onClick={() => onRemove(block.id)}
					className="text-red-400 hover:text-red-600 text-xs font-medium cursor-pointer"
				>
					Remove
				</button>
			</div>
		</div>
	);
}

// ---- Available block (clickable) ----

function AvailableBlockCard({ block, onAdd }: AvailableProps) {
	return (
		<button
			type="button"
			onClick={() => onAdd(block)}
			className="flex flex-col items-start p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600
				hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50
				transition-colors text-left cursor-pointer"
		>
			<p className="font-medium text-sm">{block.name}</p>
			<p className="text-xs text-gray-500 dark:text-gray-400">
				{block.description}
			</p>
		</button>
	);
}
