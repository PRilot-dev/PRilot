import { CheckCircle, Clock, Users, Zap } from "lucide-react";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import { Card } from "@/components/ui/Card";

const benefits = [
	{
		title: "Instant PR Descriptions and Titles",
		description: "Generate detailed, context-aware descriptions in seconds",
	},
	{
		title: "Consistent, High-Quality PRs",
		description:
			"Every pull request follows best practices with clear structure and useful context.",
	},
	{
		title: "Faster Reviews, Fewer Comments",
		description:
			"Reviewers immediately understand the changes, reducing clarification requests.",
	},
];

const stats = [
	{
		icon: Clock,
		value: "3+ Hours Saved",
		valueShort: "3+ Hours Saved",
		description: "Every month on average",
		descriptionLong: "Per month for each developer of a team",
		color: "blue",
	},
	{
		icon: Users,
		value: "50+ PRs per Month",
		description: "For a team of 4 developers",
		color: "blue",
	},
	{
		icon: Zap,
		value: "< 2 Seconds",
		description: "Time it takes for PRilot to generate a PR",
		color: "green",
	},
];

export default function BenefitsSection() {
	return (
		<section
			id="benefits"
			className="bg-linear-to-br from-white/60 to-gray-50/60 dark:from-zinc-950/80 dark:to-gray-900/70 py-8 lg:py-4"
		>
			<div className="grid lg:grid-cols-2 gap-12 lg:gap-24 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
				{/* Benefits List */}
				<AnimatedSlide x={-30} triggerOnView amount={0.3}>
					<div className="flex flex-col gap-4 px-4 lg:px-0">
						<h2 className="text-4xl md:text-5xl font-bold">
							Save Hours Every Week
						</h2>
						<p className="text-lg text-gray-500 mb-4 py-4 md:py-2 lg:py-0">
							Stop wasting time writing PR descriptions manually. Let AI do the
							heavy lifting while you focus on what matters most - writing great
							code.
						</p>

						<ul className="flex flex-col gap-4">
							{benefits.map((benefit) => (
								<li
									key={benefit.title}
									className="flex gap-4 items-center hover:scale-105 duration-300"
								>
									<CheckCircle className="text-green-600 dark:text-green-400 shrink-0" />
									<div>
										<p>{benefit.title}</p>
										<p className="text-gray-500">{benefit.description}</p>
									</div>
								</li>
							))}
						</ul>
					</div>
				</AnimatedSlide>

				{/* Stats Cards */}
				<AnimatedSlide x={30} triggerOnView amount={0.3}>
					<div className="bg-white/30 dark:bg-gray-800/50 rounded-3xl flex flex-col justify-center gap-6 p-4 py-8 md:p-8 shadow-lg dark:shadow-none border border-gray-300/40 dark:border-gray-800/50">
						{stats.map((stat) => {
							const Icon = stat.icon;
							const isBlue = stat.color === "blue";

							return (
								<Card
									key={stat.value}
									className={`flex items-center p-4 gap-4 hover:scale-105 transition group ${
										isBlue
											? "bg-blue-200/40! dark:bg-blue-900/25!"
											: "bg-green-200/40! dark:bg-green-800/20!"
									}`}
								>
									<Icon
										size={40}
										className={`shrink-0 group-hover:rotate-360 duration-500 ${
											isBlue
												? "text-blue-500 dark:text-blue-300"
												: "text-green-500 dark:text-green-300"
										} ${stat.icon === Users ? "group-hover:-rotate-15" : ""}`}
									/>
									<div className="md:hidden">
										<p
											className={`text-2xl ${
												isBlue
													? "text-blue-500 dark:text-blue-300"
													: "text-green-500 dark:text-green-300"
											}`}
										>
											{stat.valueShort || stat.value}
										</p>
										<p>{stat.description}</p>
									</div>
									<div className="hidden md:block">
										<p
											className={`text-2xl ${
												isBlue
													? "text-blue-500 dark:text-blue-300"
													: "text-green-500 dark:text-green-300"
											}`}
										>
											{stat.value}
										</p>
										<p>{stat.descriptionLong || stat.description}</p>
									</div>
								</Card>
							);
						})}
					</div>
				</AnimatedSlide>
			</div>
		</section>
	);
}
