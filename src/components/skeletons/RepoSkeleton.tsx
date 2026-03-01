/** biome-ignore-all lint/suspicious/noArrayIndexKey: index for key is ok for skeleton loader */
import { CardContent, CardHeader } from "../ui/Card";

export default function RepoSkeleton() {
	return (
		<div className="p-6 space-y-6 animate-pulse">
			{/* Header skeleton */}
			<div className="flex flex-col md:flex-row items-start justify-between gap-4">
				<div className="space-y-4 pt-2">
					<div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
					<div className="h-4 w-40 bg-gray-300 dark:bg-gray-700 rounded"></div>
				</div>
				<div className="flex gap-4">
					<div className="h-8 w-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
					<div className="h-8 w-30 bg-gray-300 dark:bg-gray-700 rounded"></div>
				</div>
			</div>

			{/* Stats cards skeleton */}
			<div className="grid gap-4 md:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<div key={i} className="h-26 bg-gray-300 dark:bg-gray-700 rounded-xl" />
				))}
			</div>

			{/* PR list skeleton */}
			<div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-sm p-4 rounded-xl">
				<CardHeader>
					<div className="h-6 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
					<div className="h-4 w-64 bg-gray-300 dark:bg-gray-700 rounded mt-1"></div>
				</CardHeader>
				<CardContent className="space-y-2">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="h-12 w-full bg-gray-300 dark:bg-gray-700 rounded"
						/>
					))}
				</CardContent>
			</div>
		</div>
	);
}
