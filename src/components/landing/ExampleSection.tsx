"use client";

import { ArrowDown, Code, Eye, FileText, GitBranch, Sparkles } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import AnimatedOpacity from "@/components/animations/AnimatedOpacity";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import { Card } from "@/components/ui/Card";

const PR_DESCRIPTION = `## Description

Implements Stripe subscription payments with secure checkout sessions and webhook-based subscription lifecycle management. Enables users to upgrade to Pro and unlock premium features.

## Changes

### 1. **Stripe setup & configuration**

* Added Stripe SDK initialization with environment variables (\`STRIPE_SECRET_KEY\`, \`STRIPE_WEBHOOK_SECRET\`, \`STRIPE_PRICE_ID\`).
* Created shared \`stripe\` utility for server-side usage.

### 2. **Checkout session endpoint**

* Added \`POST /api/billing/create-checkout-session\`.
* Validates authenticated user and creates subscription-mode Checkout session.
* Attaches \`userId\` in metadata for webhook reconciliation.

### 3. **Webhook handling**

* Added \`POST /api/webhooks/stripe\` endpoint with signature verification.
* Handles key events:

  * \`checkout.session.completed\`
  * \`invoice.payment_succeeded\`
  * \`customer.subscription.deleted\`
* Updates user subscription status accordingly.

### 4. **Database updates**

* Extended \`User\` model with \`stripeCustomerId\`, \`subscriptionStatus\`, and \`currentPeriodEnd\`.
* Added enum for subscription state (\`active\`, \`past_due\`, \`canceled\`, \`incomplete\`).

### 5. **Frontend billing page**

* Added \`BillingPage\` with upgrade button and subscription status display.
* Redirects to Stripe Checkout and shows success/error notifications.

---

## How to Test

* Add Stripe test keys to \`.env\`.
* Run database migration.
* Use Stripe CLI to forward webhooks locally.
* Complete checkout with test card \`4242 4242 4242 4242\`.
* Verify subscription status updates and premium routes are accessible.`;

export default function ExampleSection() {
	const [showPreview, setShowPreview] = useState(true);
	return (
		<section id="example" className="py-20 bg-linear-to-b from-slate-100 to-white dark:from-[#0A0A0D] dark:to-[#13131d]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<AnimatedOpacity>
					<h2 className="text-4xl md:text-5xl text-center mb-4 text-gray-900 dark:text-white font-bold">
						See What PRilot Generates
					</h2>
					<p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-lg mx-auto text-lg">
						A real example of Deep mode analyzing file changes and producing a
						structured pull request.
					</p>
				</AnimatedOpacity>

				<div className="flex flex-col gap-6 max-w-5xl mx-auto">
					{/* Input panel */}
					<AnimatedSlide x={-30} triggerOnView amount={0.3}>
						<Card className="p-6 shadow-lg! dark:shadow-none!">
							<p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
								Input
							</p>
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<GitBranch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Base:
									</span>
									<span className="text-sm font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
										main
									</span>
								</div>
								<div className="flex items-center gap-2">
									<GitBranch className="w-4 h-4 text-blue-500 dark:text-blue-400" />
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Compare:
									</span>
									<span className="text-sm font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
										feature/payments
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Mode:
									</span>
									<span className="text-sm font-medium px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
										Deep
									</span>
								</div>
								<div className="flex items-center gap-2">
									<FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
									<span className="text-sm text-gray-600 dark:text-gray-400">
										10 files changed
									</span>
								</div>
							</div>
						</Card>
					</AnimatedSlide>

					{/* Arrow connector */}
					<div className="flex items-center justify-center">
						<ArrowDown className="w-6 h-6 text-blue-400 dark:text-blue-500" />
					</div>

					{/* Output panel */}
					<AnimatedSlide x={30} triggerOnView amount={0.2}>
						<Card className="p-6 shadow-lg! dark:shadow-none!">
							<div className="flex items-center justify-between mb-4">
								<p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
									Generated PR
								</p>
								<div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-md p-1">
									<button
										type="button"
										onClick={() => setShowPreview(false)}
										className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
											!showPreview
												? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
												: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
										}`}
									>
										<Code size={14} />
										Edit
									</button>
									<button
										type="button"
										onClick={() => setShowPreview(true)}
										className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
											showPreview
												? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
												: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
										}`}
									>
										<Eye size={14} />
										Preview
									</button>
								</div>
							</div>

							{/* PR title */}
							<p className="font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
								Add Stripe payment integration with webhook handling
							</p>

							{/* PR body */}
							<div className="text-sm">
								{showPreview ? (
									<div className="markdown">
										<ReactMarkdown>
											{PR_DESCRIPTION}
										</ReactMarkdown>
									</div>
								) : (
									<pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono p-4 rounded-md overflow-x-auto">
										{PR_DESCRIPTION}
									</pre>
								)}
							</div>
						</Card>
					</AnimatedSlide>
				</div>
			</div>
		</section>
	);
}
