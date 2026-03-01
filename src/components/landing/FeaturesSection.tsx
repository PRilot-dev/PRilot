import { GitBranch, Globe, Users, Zap } from "lucide-react";
import AnimatedOpacity from "@/components/animations/AnimatedOpacity";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import { Card } from "@/components/ui/Card";

const features = [
	{
		icon: Zap,
		title: "Instant Pull Request Generation",
		description:
			"Generate complete PR descriptions in seconds with a single click. Choose Fast mode for quick generation based on commit messages, or Deep mode for thorough code-aware analysis. Get professional results every time.",
		color: "blue",
	},
	{
		icon: Users,
		title: "Collaborative Workflow",
		description:
			"Invite and manage team members so your entire team can benefit from PRilot. Share templates, maintain consistent standards, and streamline your team's PR workflow across all projects.",
		color: "purple",
	},
	{
		icon: Globe,
		title: "Universal Language Support",
		description:
			"Works with any programming language—JavaScript, Python, Go, Rust, Java, and more. Generate PR descriptions in English, French, Spanish, German, Italian, or Portuguese to match your team's preference.",
		color: "cyan",
	},
	{
		icon: GitBranch,
		title: "Seamless Provider Integration",
		description:
			"Connect your GitHub account and PRilot handles everything: fetching branch diffs, analyzing changes, and sending pull requests directly to your repository. GitLab support is coming soon.",
		color: "green",
	},
];

const colorClasses = {
	blue: {
		bg: "bg-blue-100 dark:bg-blue-900/30",
		text: "text-blue-600 dark:text-blue-400",
	},
	purple: {
		bg: "bg-purple-100 dark:bg-purple-900/30",
		text: "text-purple-600 dark:text-purple-400",
	},
	cyan: {
		bg: "bg-cyan-100 dark:bg-cyan-900/30",
		text: "text-cyan-600 dark:text-cyan-400",
	},
	green: {
		bg: "bg-green-100 dark:bg-green-900/30",
		text: "text-green-600 dark:text-green-400",
	},
};

export default function FeaturesSection() {
	return (
		<section id="features" className="py-20 bg-linear-to-b from-white to-white/60 dark:from-[#13131d] dark:to-[#13131d]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<AnimatedOpacity>
					<h2 className="text-4xl md:text-5xl text-center mb-4 text-gray-900 dark:text-white font-bold">
						Everything You Need to Ship Faster
					</h2>
					<p className="text-center text-gray-500 dark:text-gray-400 mb-16 max-w-2xl mx-auto text-lg">
						Powerful features designed to streamline your entire PR workflow.
					</p>
				</AnimatedOpacity>

				<div className="grid md:grid-cols-2 gap-8">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						const colors =
							colorClasses[feature.color as keyof typeof colorClasses];

						return (
							<AnimatedSlide
								key={feature.title}
								x={index % 2 === 0 ? -30 : 30}
								triggerOnView
								amount={0.3}
							>
								<Card className="p-6 h-full hover:scale-[1.02] transition-transform shadow-lg! dark:shadow-none!">
									<div
										className={`w-12 h-12 mb-4 rounded-xl ${colors.bg} flex items-center justify-center`}
									>
										<Icon className={`w-6 h-6 ${colors.text}`} />
									</div>
									<h3 className="text-xl mb-3 text-gray-900 dark:text-white font-semibold">
										{feature.title}
									</h3>
									<p className="text-gray-600 dark:text-gray-400">
										{feature.description}
									</p>
								</Card>
							</AnimatedSlide>
						);
					})}
				</div>
			</div>
		</section>
	);
}
