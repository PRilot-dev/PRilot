/** biome-ignore-all lint/suspicious/noArrayIndexKey: Ok to use index for key for skeleton component */
import { Card, CardContent, CardHeader } from "@/components/Card";

export default function DashboardSkeleton() {
	return (
		<div className="flex h-screen bg-linear-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900 animate-pulse">
			{/* Main Content */}
			<div className="fade-in flex-1 flex flex-col overflow-hidden">
				<main className="flex-1 overflow-y-auto p-6 space-y-8">
					{/* Page header skeleton */}
					<div className="pb-6">
						<div className="h-8 w-1/3 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
						<div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded"></div>
					</div>

					{/* Stats Cards */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{[...Array(4)].map((_, i) => (
							<Card
								key={i}
								className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-sm"
							>
								<CardHeader className="flex justify-between pb-2">
									<div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
									<div className="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
								</CardHeader>
								<CardContent>
									<div className="h-8 w-12 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
									<div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Recent Activity */}
					<div className="grid gap-6 lg:grid-cols-2">
						{[...Array(2)].map((_, i) => (
							<Card
								key={i}
								className="bg-white/70 p-6 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-sm"
							>
								<CardHeader>
									<div className="h-5 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
									<div className="h-3 w-48 bg-gray-200 dark:bg-gray-600 rounded"></div>
								</CardHeader>
								<CardContent className="space-y-4">
									{[...Array(3)].map((_, j) => (
										<div
											key={j}
											className="flex justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/90"
										>
											<div className="flex-1 space-y-2">
												<div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
												<div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
											</div>
											<div className="h-5 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
										</div>
									))}
								</CardContent>
							</Card>
						))}
					</div>
				</main>
			</div>
		</div>
	);
}
