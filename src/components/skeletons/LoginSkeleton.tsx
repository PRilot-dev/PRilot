/** biome-ignore-all lint/suspicious/noArrayIndexKey: Ok to use index for key for skeleton component */
export default function LoginSkeleton() {
	return (
		<div className="flex justify-center items-center min-h-screen bg-linear-to-b from-blue-100 to-white dark:from-zinc-950 dark:to-[#13131d]">
			<div className="fade-in animate-pulse max-w-md w-full p-8 border border-gray-300 dark:border-gray-700 rounded-2xl text-center shadow-md bg-white/40 dark:bg-zinc-900/25 space-y-6">
				{/* Top links */}
				<div className="flex justify-between items-center w-full max-w-md mb-8">
					<div className="h-4 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
					<div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
				</div>

				{/* Titles */}
				<div className="space-y-2">
					<div className="h-8 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mx-auto"></div>
					<div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-600 rounded mx-auto"></div>
				</div>

				{/* Login/Register buttons */}
				<div className="grid grid-cols-2 max-w-xs mx-auto rounded-xl mb-6 overflow-hidden border border-gray-200 dark:border-gray-700">
					<div className="h-10 bg-gray-300 dark:bg-gray-700"></div>
					<div className="h-10 bg-gray-300 dark:bg-gray-700"></div>
				</div>

				{/* Form */}
				<div className="flex flex-col gap-4 text-left">
					{[...Array(2)].map((_, i) => (
						<div key={i} className="space-y-1">
							<div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
							<div className="h-10 w-full bg-gray-200 dark:bg-gray-600 rounded"></div>
						</div>
					))}
					<div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded mt-2"></div>
				</div>

				{/* Divider */}
				<div className="my-4 flex items-center gap-2">
					<span className="grow h-px bg-gray-300 dark:bg-gray-600"></span>
					<div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
					<span className="grow h-px bg-gray-300 dark:bg-gray-600"></span>
				</div>

				{/* OAuth buttons */}
				<div className="grid md:grid-cols-2 gap-4 justify-center">
					<div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
					<div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
				</div>
			</div>
		</div>
	);
}
