"use client";

import { ArrowRight, ChevronDown, Code, Eye, HelpCircle, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import AnimatedOpacity from "@/components/animations/AnimatedOpacity";
import AnimatedScale from "@/components/animations/AnimatedScale";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import LandingCTA from "@/components/landing/LandingCTA";
import { Card } from "@/components/ui/Card";

const PR_DESCRIPTION = `## Description

Migrates authentication system from JWT-based sessions to OAuth2 with PKCE flow. Implements refresh token rotation for enhanced security and adds social login providers (GitHub, Google) with proper state management.

## Changes

### 1. **OAuth2 authentication flow**

* Implemented PKCE authorization code flow with state validation
* Added refresh token rotation with automatic expiry handling
* Created OAuth provider configurations for GitHub and Google

### 2. **Login interface updates**

* Added social login buttons with provider branding
* Implemented loading states and error handling
* Created unified callback handler for all providers

### 3. **Session management**

* Replaced JWT token storage with secure HTTP-only cookies
* Added automatic session refresh on token expiry
* Implemented graceful logout with token revocation

---

## How to Test

* Set up OAuth credentials for GitHub and Google in \`.env\`.
* Run database migration for new auth tables.
* Test login flow with each provider.
* Verify token refresh by waiting for expiry.
* Check logout properly revokes all sessions.`;

export default function HeroSection() {
	const [showPreview, setShowPreview] = useState(true);

	return (
		<section className="relative overflow-hidden bg-linear-to-b from-[#e5f0ff] to-white dark:from-zinc-950 dark:to-[#13131d] pt-16">
			<div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-16">
				<div className="text-center">
					<AnimatedSlide y={-20} triggerOnView={false}>
						<h1 className="font-extrabold text-6xl md:text-7xl lg:text-8xl mb-5">
							<span className="hero-pr bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
								PR
							</span>
							<span className="hero-ilot bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
								ilot
							</span>
						</h1>
						<p className="text-3xl md:text-4xl mb-6 text-gray-800 dark:text-gray-200 font-bold">
							From branch diff to pull request in seconds.
						</p>
					</AnimatedSlide>

					<AnimatedOpacity delay={0.3} duration={0.8}>
						<p className="text-lg md:text-xl mb-12 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
							Stop wasting time and energy writing pull requests. PRilot handles
							that for you, giving you perfect PRs in just one click.
						</p>
					</AnimatedOpacity>

					{/* CTA Button */}
					<AnimatedScale scale={0.9} delay={0.5} triggerOnView={false}>
						<LandingCTA />
					</AnimatedScale>
				</div>

				{/* Hero Mockup — mirrors the real PR generation page */}
				<AnimatedSlide y={40} triggerOnView={false}>
					<div className="mt-16 max-w-5xl mx-auto">
						<Card className="shadow-2xl! dark:shadow-none! rounded-2xl! px-2! py-6 md:p-8! space-y-8">
							{/* Page title row */}
							<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
								<div>
									<h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
										Generate Pull Request
									</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
										Select branches and let AI generate a comprehensive PR
										description
									</p>
								</div>
								{/* Language selector */}
								<div className="flex flex-col items-start sm:items-end gap-1">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Language
									</span>
									<div className="relative">
										<div className="py-2 pl-3 pr-8 rounded-lg bg-white/70 dark:bg-gray-800/25 border border-gray-200 dark:border-gray-800 shadow-md text-sm text-gray-800 dark:text-gray-200">
											English
										</div>
										<ChevronDown className="pointer-events-none absolute inset-y-0 right-2 h-full w-4 text-gray-400" />
									</div>
								</div>
							</div>

							{/* Branch selectors — 2-column like the real page */}
							<div className="relative grid md:grid-cols-2 gap-6 md:gap-16">
								{/* Base branch */}
								<div className="space-y-2 flex flex-col sm:items-center w-full">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Base Branch
									</span>
									<div className="relative w-full">
										<div className="w-full p-2.5 rounded-lg bg-white/70 dark:bg-gray-800/25 border border-gray-200 dark:border-gray-800 shadow-md text-sm text-gray-800 dark:text-gray-200">
											main
										</div>
										<ChevronDown className="pointer-events-none absolute inset-y-0 right-3 h-full w-4 text-gray-400" />
									</div>
								</div>

								{/* Arrow between branches */}
								<div className="absolute hidden md:flex inset-0 w-full h-full justify-center items-center pt-7 pointer-events-none">
									<ArrowRight className="w-6 h-6 text-gray-400 dark:text-gray-500 rotate-180" />
								</div>

								{/* Compare branch */}
								<div className="space-y-2 flex flex-col sm:items-center w-full">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Compare Branch
									</span>
									<div className="relative w-full">
										<div className="w-full p-2.5 rounded-lg bg-white/70 dark:bg-gray-800/25 border border-blue-300 dark:border-blue-700 shadow-md text-sm text-blue-700 dark:text-blue-300">
											feature/auth-refactor
										</div>
										<ChevronDown className="pointer-events-none absolute inset-y-0 right-3 h-full w-4 text-blue-400" />
									</div>
								</div>
							</div>

							{/* Mode selector + Generate button */}
							<div className="flex flex-col items-center gap-4">
								{/* Mode toggle — mirrors PRGenerationModeSelector */}
								<div className="w-full max-w-md flex justify-between items-center gap-4 p-2 rounded-lg bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-800">
									<div className="flex items-center gap-4">
										<span className="text-sm text-gray-400 dark:text-gray-500">
											Fast
										</span>
										<div className="w-11 h-6 bg-blue-500 dark:bg-blue-600 rounded-full relative">
											<div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
										</div>
										<span className="text-sm font-bold text-gray-800 dark:text-gray-100">
											Deep
										</span>
									</div>

									{/* Help button */}
									<button
										type="button"
										className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
										title="Help"
									>
										<HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
									</button>
								</div>

								{/* Generate button */}
								<div className="w-full max-w-md py-2.5 rounded-lg bg-gray-900 dark:bg-gray-200 text-white dark:text-black text-center text-sm font-medium shadow-lg flex items-center justify-center gap-2">
									<Sparkles className="w-4 h-4" />
									Generate with AI
								</div>
							</div>

							{/* PR Title Card */}
							<div className="rounded-xl bg-white/70 dark:bg-gray-800/25 border border-gray-200 dark:border-gray-800 shadow-lg p-4 md:p-6">
								<p className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
									Title
								</p>
								<p className="font-semibold text-gray-900 dark:text-gray-100 pb-3 border-b border-gray-200 dark:border-gray-700">
									Refactor authentication flow and add OAuth2 support
								</p>
							</div>

							{/* PR Description Card */}
							<div className="rounded-xl bg-white/70 dark:bg-gray-800/25 border border-gray-200 dark:border-gray-800 shadow-lg p-4 md:p-6">
								<div className="flex items-center justify-between mb-4">
									<p className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
										Description
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

								<div className="text-sm relative overflow-hidden max-h-80">
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

									{/* Fade-out gradient */}
									<div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-white dark:from-[#181C28] to-transparent pointer-events-none" />
								</div>
							</div>

							{/* Send button */}
							<div className="flex justify-center">
								<div className="w-1/2 h-10 flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-zinc-950/60 border border-gray-300 dark:border-gray-800 text-sm shadow-sm">
									<Send className="w-4 h-4" />
									Send Pull Request
								</div>
							</div>
						</Card>
					</div>
				</AnimatedSlide>
			</div>
		</section>
	);
}
