"use client";

import { Code, Eye, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AutoResizeTextarea } from "./ui/AutoResizeTextArea";
import { Card } from "./ui/Card";

type PREditorProps = {
	title: string | undefined;
	description: string | undefined;
	showEditOrPreview: "edit" | "preview";
	setTitle: (val: string) => void;
	setDescription: (val: string) => void;
	setShowEditOrPreview: (val: "edit" | "preview") => void;
	onSend: () => void;
	isSendingPr: boolean;
};

export function PREditor({
	title,
	description,
	showEditOrPreview,
	setTitle,
	setDescription,
	setShowEditOrPreview,
	onSend,
	isSendingPr,
}: PREditorProps) {
	return (
		<div className="flex flex-col gap-6">
			{/* Title Card */}
			<Card className="bg-white/70 dark:bg-gray-800/25 backdrop-blur-sm border border-gray-200 dark:border-gray-800 shadow-lg p-6">
				<label htmlFor="pr-title" className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 block">
					Title
				</label>
				<input
					id="pr-title"
					value={title ?? ""}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Brief description of changes"
					className="w-full font-semibold text-gray-900 dark:text-gray-100 pb-3 border-b border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 placeholder:text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
				/>
			</Card>

			{/* Description Card */}
			<Card className="md:p-6">
				<div className="flex items-center justify-between mb-4">
					<label htmlFor="description" className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
						Description
					</label>
					<div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-md p-1">
						<button
							type="button"
							onClick={() => setShowEditOrPreview("edit")}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
								showEditOrPreview === "edit"
									? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
							}`}
						>
							<Code size={14} />
							Edit
						</button>
						<button
							type="button"
							onClick={() => setShowEditOrPreview("preview")}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
								showEditOrPreview === "preview"
									? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
							}`}
						>
							<Eye size={14} />
							Preview
						</button>
					</div>
				</div>

				<div>
					{showEditOrPreview === "edit" ? (
						<AutoResizeTextarea
							value={description ?? ""}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Detailed description in Markdown..."
							className="w-full block min-h-75 text-gray-700 dark:text-gray-300 whitespace-pre-wrap md:p-4 rounded-md resize-none focus:outline-none"
						/>
					) : (
						<div className="markdown min-h-75 md:p-4 rounded-md">
							<ReactMarkdown>{description}</ReactMarkdown>
						</div>
					)}
				</div>
			</Card>

			{/* Send button */}
			<button
				type="button"
				onClick={onSend}
				disabled={!title || !description || isSendingPr}
				title={
					!title || !description
						? "Please enter title and description to send PR"
						: ""
				}
				className={`h-auto w-full md:w-1/2 mx-auto my-4 py-2 flex items-center justify-center shadow-lg rounded-lg bg-gray-900 text-white dark:bg-gray-200 dark:text-black hover:bg-gray-700 hover:dark:bg-gray-300 group
            ${!title || !description || isSendingPr ? "cursor-not-allowed opacity-60" : "hover:bg-gray-700 hover:dark:bg-gray-300 hover:cursor-pointer"}
          `}
			>
				<Send className="w-4 h-4 mr-2" />
				{isSendingPr ? "Sending your PR..." : "Send Pull Request"}
			</button>
		</div>
	);
}
