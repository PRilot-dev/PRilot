"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import AnimatedOpacity from "@/components/animations/AnimatedOpacity";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import { Card } from "@/components/ui/Card";
import { faqCategories } from "@/data/faq";

export default function FAQSection() {
	const [selectedCategory, setSelectedCategory] = useState("general");
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const toggleFAQ = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	const currentCategory = faqCategories.find((cat) => cat.id === selectedCategory);

	return (
		<section
			id="faq"
			className="min-h-screen py-20 bg-white dark:bg-[#0A0A0D]"
		>
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<AnimatedOpacity>
					<h2 className="text-4xl md:text-5xl text-center mb-4 text-gray-900 dark:text-white font-bold">
						Frequently Asked Questions
					</h2>
					<p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto text-lg">
						Everything you need to know about PRilot
					</p>
				</AnimatedOpacity>

				<div className="grid lg:grid-cols-3 gap-8">
					{/* Category selector */}
					<AnimatedSlide x={-20} triggerOnView amount={0.3}>
						<div className="lg:col-span-1">
							<div className="flex flex-col gap-2 sticky top-24">
								{faqCategories.map((category) => (
									<button
										key={category.id}
										type="button"
										onClick={() => {
											setSelectedCategory(category.id);
											setOpenIndex(null);
										}}
										className={`text-left px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer border border-gray-200 dark:border-gray-800 ${
											selectedCategory === category.id
												? "bg-blue-500 dark:bg-blue-600 text-white shadow-md"
												: "bg-white/70 dark:bg-gray-800/25 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/40"
										}`}
									>
										{category.name}
									</button>
								))}
							</div>
						</div>
					</AnimatedSlide>

					{/* FAQ list */}
					<div className="lg:col-span-2">
						<div className="flex flex-col gap-3">
							{currentCategory?.faqs.map((faq, index) => (
								<AnimatedSlide
									key={faq.question}
									y={20}
									triggerOnView
									amount={0.3}
								>
									<Card className="overflow-hidden">
										<button
											type="button"
											onClick={() => toggleFAQ(index)}
											className="w-full flex items-center justify-between p-5 text-left rounded-lg cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
										>
											<span className="font-semibold text-gray-900 dark:text-gray-100 pr-8">
												{faq.question}
											</span>
											<ChevronDown
												className={`shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
													openIndex === index ? "rotate-180" : ""
												}`}
												size={20}
											/>
										</button>
										<div
											className={`overflow-hidden transition-all duration-300 ${
												openIndex === index ? "max-h-96" : "max-h-0"
											}`}
										>
											<div className="px-5 pb-5 pt-2 text-gray-600 dark:text-gray-400 whitespace-pre-line">
												{faq.answer}
											</div>
										</div>
									</Card>
								</AnimatedSlide>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
