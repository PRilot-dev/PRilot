"use client";

import { ArrowBigLeftDash } from "lucide-react";
import AnimatedOpacity from "../animations/AnimatedOpacity";

export default function PREditorSkeleton() {
	return (
		<AnimatedOpacity className="p-2 md:p-6 space-y-6 animate-pulse">
			{/* Hero / Header */}
			<section className="grid grid-cols-3 mb-10">
				<div className="col-span-2 space-y-4">
					<div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
					<div className="hidden md:block h-6 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
				</div>
				<div className="space-y-4 flex flex-col items-end">
					<div className="h-10 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
					<div className="h-10 w-1/2 bg-gray-300 dark:bg-gray-700 rounded hidden md:block"></div>
				</div>
				<div className="md:hidden col-span-3 h-4 bg-gray-300 dark:bg-gray-700 rounded mt-2"></div>
			</section>

			{/* Configuration / Branch selectors */}
			<section className="flex flex-col space-y-6 mb-12">
				<div className="relative grid grid-cols-2 gap-20">
					<div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
					<div className="absolute inset-0 w-full h-full flex justify-center items-center pointer-events-none">
						<ArrowBigLeftDash
							size={28}
							className="text-gray-400 dark:text-gray-600"
						/>
					</div>
					<div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
				</div>

				<div className="h-10 w-56 mt-4 mx-auto bg-gray-300 dark:bg-gray-700 rounded"></div>
			</section>

			{/* PR Editor */}
			<section className="h-100 bg-gray-300 dark:bg-gray-700 rounded-xl"></section>
		</AnimatedOpacity>
	);
}
