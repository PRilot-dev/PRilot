import { Clock, Zap } from "lucide-react";
import AnimatedOpacity from "@/components/animations/AnimatedOpacity";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import { Card } from "@/components/Card";

export default function WorkflowSection() {
	return (
		<section className="py-20 bg-linear-to-b from-white to-slate-100 dark:from-[#13131d] dark:to-[#13131d]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<AnimatedOpacity>
					<h2 className="text-4xl md:text-5xl text-center mb-4 text-gray-900 dark:text-white font-bold">
						Stop Writing PRs by Hand
					</h2>
					<p className="text-center text-gray-500 dark:text-gray-400 mb-16 max-w-2xl mx-auto text-lg">
						What used to take minutes now takes seconds.
					</p>
				</AnimatedOpacity>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
					{/* Without PRilot */}
					<AnimatedSlide x={-30} triggerOnView amount={0.3}>
						<Card className="p-6 shadow-lg! border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 h-full">
							<div className="flex items-center gap-3 mb-6">
								<div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
									<Clock className="w-6 h-6 text-red-500 dark:text-red-400" />
								</div>
								<div>
									<h3 className="text-xl font-bold text-gray-900 dark:text-white">
										Without PRilot
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										The manual way
									</p>
								</div>
							</div>

							<ul className="space-y-3.5 text-sm text-gray-600 dark:text-gray-400 mb-8">
								<li className="flex items-center gap-2.5">
									<span className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500 shrink-0" />
									Read through every file change
								</li>
								<li className="flex items-center gap-2.5">
									<span className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500 shrink-0" />
									Manually write title and description
								</li>
								<li className="flex items-center gap-2.5">
									<span className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500 shrink-0" />
									Format markdown, add test steps
								</li>
								<li className="flex items-center gap-2.5">
									<span className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500 shrink-0" />
									Repeat for every single PR
								</li>
							</ul>

							<div className="pt-4 border-t border-gray-200 dark:border-gray-700">
								<span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
									~15 min
								</span>
								<span className="text-sm text-gray-400 dark:text-gray-500 ml-2">
									per pull request
								</span>
							</div>
						</Card>
					</AnimatedSlide>

					{/* With PRilot */}
					<AnimatedSlide x={30} triggerOnView amount={0.3}>
						<Card className="p-6 shadow-lg! border-2 border-green-300 dark:border-green-700 bg-linear-to-br from-green-50/50 to-white dark:from-green-900/10 dark:to-gray-800/25 h-full">
							<div className="flex items-center gap-3 mb-6">
								<div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
									<Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<h3 className="text-xl font-bold text-gray-900 dark:text-white">
										With PRilot
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">
										The automated way
									</p>
								</div>
							</div>

							<ul className="space-y-3.5 text-sm text-gray-700 dark:text-gray-300 mb-8">
								<li className="flex items-center gap-2.5">
									<span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
									Pick your branches
								</li>
								<li className="flex items-center gap-2.5">
									<span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
									AI analyzes diffs and commits
								</li>
								<li className="flex items-center gap-2.5">
									<span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
									Structured PR ready to send
								</li>
								<li className="flex items-center gap-2.5">
									<span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
									Consistent quality every time
								</li>
							</ul>

							<div className="pt-4 border-t border-green-200 dark:border-green-800">
								<span className="text-2xl font-bold text-green-600 dark:text-green-400">
									&lt; 2 seconds
								</span>
								<span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
									per pull request
								</span>
							</div>
						</Card>
					</AnimatedSlide>
				</div>
			</div>
		</section>
	);
}
