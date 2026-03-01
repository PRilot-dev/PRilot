import AnimatedOpacity from "@/components/animations/AnimatedOpacity";
import AnimatedSlide from "@/components/animations/AnimatedSlide";

const steps = [
	{
		num: "1",
		title: "Connect Your Provider",
		desc: "Connect PRilot to your GitHub or GitLab account and select which repositories to grant access to.",
	},
	{
		num: "2",
		title: "Pick Your Branches",
		desc: "Choose your base and compare branches. PRilot fetches the latest list from your provider.",
	},
	{
		num: "3",
		title: "Choose Fast or Deep",
		desc: "Fast reads commit messages. Deep analyzes file diffs and commits for a thorough description.",
	},
	{
		num: "4",
		title: "Review & Edit",
		desc: "Get a structured PR in a markdown editor with live preview and auto-save on edit.",
	},
	{
		num: "5",
		title: "Send Your Pull Request",
		desc: "One click creates the pull request. You get a direct link to review and merge.",
	},
];

export default function HowItWorksSection() {
	return (
		<section
			id="how-it-works"
			className="py-20 bg-gray-50/60 dark:bg-zinc-950"
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<AnimatedOpacity>
					<h2 className="text-4xl md:text-5xl text-center mb-4 text-gray-900 dark:text-white font-bold">
						How PRilot Works
					</h2>
					<p className="text-center text-gray-500 dark:text-gray-400 mb-16 max-w-lg mx-auto text-lg">
						Five steps from branch selection to a live pull request.
					</p>
				</AnimatedOpacity>

				<div className="relative">
					{/* Connecting line — desktop only */}
					<div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-linear-to-r from-blue-300 via-purple-300 to-green-300 dark:from-blue-700 dark:via-purple-700 dark:to-green-700" />

					<div className="grid md:grid-cols-5 gap-8 md:gap-4 relative">
						{steps.map((step) => (
							<AnimatedSlide
								key={step.num}
								y={30}
								triggerOnView
								amount={0.3}
							>
								<div className="text-center relative">
									<div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold z-10 relative">
										{step.num}
									</div>
									<h3 className="text-lg mb-2 font-semibold text-gray-900 dark:text-white">
										{step.title}
									</h3>
									<p className="text-gray-600 dark:text-gray-400 text-sm">
										{step.desc}
									</p>
								</div>
							</AnimatedSlide>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
