import { GitPullRequest } from "lucide-react";
import AnimatedOpacity from "@/components/animations/AnimatedOpacity";
import AnimatedSlide from "@/components/animations/AnimatedSlide";
import { Card } from "@/components/ui/Card";

const prPairs = [
	{
		messy: {
			author: "alice",
			title: "Fix token refresh bug",
			body: "Fixes a bug where sessions expired during token refresh. Updated refreshToken() to extend the TTL and added retry logic for when tokens are expired. You can test by logging in, waiting for the token to near expiry, and checking that the session persists after refresh.",
		},
		clean: {
			author: "alice",
			title: "Fix session expiry on token refresh",
			sections: [
				{
					heading: "Description",
					text: "Fixes a bug where user sessions expired during token refresh, causing unexpected logouts.",
				},
				{
					heading: "Changes",
					text: "• Updated `refreshToken()` to extend session TTL\n• Added retry logic for expired refresh tokens",
				},
				{
					heading: "How to Test",
					text: "Log in → wait for token to near expiry → verify session persists after refresh.",
				},
			],
		},
	},
	{
		messy: {
			author: "bob",
			title: "Auth update - JWT",
			body: "What changed:\nReplaces session cookies with JWT tokens. Added signing/verification utils, updated login/logout endpoints, migrated the auth middleware.\n\nNotes:\nShould be backwards compatible. Tested locally.",
		},
		clean: {
			author: "bob",
			title: "Migrate authentication to JWT tokens",
			sections: [
				{
					heading: "Description",
					text: "Replaces session-cookie auth with stateless JWT tokens for better scalability.",
				},
				{
					heading: "Changes",
					text: "• Added JWT signing and verification utilities\n• Updated login/logout endpoints to issue tokens\n• Migrated auth middleware to validate JWTs",
				},
				{
					heading: "How to Test",
					text: "Log in → check Authorization header contains JWT → verify protected routes still work.",
				},
			],
		},
	},
	{
		messy: {
			author: "charlie",
			title: "API + config changes",
			body: "- Added rate limiter middleware with sliding window\n- Applied to /api/auth/* and /api/public/*\n- Added 429 response handling\n- Updated config\n- Added tests",
		},
		clean: {
			author: "charlie",
			title: "Add rate limiting to public API endpoints",
			sections: [
				{
					heading: "Description",
					text: "Adds per-IP rate limiting to all public API routes to prevent abuse.",
				},
				{
					heading: "Changes",
					text: "• Added rate limiter middleware with sliding window\n• Applied to `/api/auth/*` and `/api/public/*`\n• Added `429 Too Many Requests` response handling",
				},
				{
					heading: "How to Test",
					text: "Send 100+ requests in quick succession → verify 429 after threshold.",
				},
			],
		},
	},
];

function MiniPRCard({
	author,
	title,
	variant,
	children,
}: {
	author: string;
	title: string;
	variant: "messy" | "clean";
	children: React.ReactNode;
}) {
	const isClean = variant === "clean";

	return (
		<Card
			className={`p-0! overflow-hidden h-full border-l-3 shadow-lg! ${
				isClean
					? "border-l-green-400 dark:border-l-green-500"
					: "border-l-red-300 dark:border-l-red-500/60"
			}`}
		>
			<div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
				<GitPullRequest
					className={`w-4 h-4 shrink-0 ${
						isClean
							? "text-green-600 dark:text-green-400"
							: "text-gray-400 dark:text-gray-500"
					}`}
				/>
				<span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
					{title}
				</span>
			</div>
			<div className="px-4 py-3">
				<p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">
					{author}
				</p>
				{children}
			</div>
		</Card>
	);
}

export default function ConsistencySection() {
	return (
		<section className="py-20 bg-linear-to-b from-slate-50 to-slate-100 dark:from-[#13131d] dark:to-[#0A0A0D]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<AnimatedOpacity>
					<h2 className="text-4xl md:text-5xl text-center mb-4 text-gray-900 dark:text-white font-bold">
						One Standard, Every Pull Request
					</h2>
					<p className="text-center text-gray-500 dark:text-gray-400 mb-16 max-w-2xl mx-auto text-lg">
						Even top open-source projects have inconsistent PR
						formatting. PRilot ensures every PR follows the same
						clear structure — no matter who writes it.
					</p>
				</AnimatedOpacity>

				<div className="max-w-6xl mx-auto space-y-4">
					{/* Column labels */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="flex items-center gap-2">
							<span className="w-2.5 h-2.5 rounded-full bg-red-400 dark:bg-red-500 shrink-0" />
							<p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
								3 developers, 3 different styles
							</p>
						</div>
						<div className="hidden lg:flex items-center gap-2">
							<span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
							<p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
								Same 3 PRs, standardized with PRilot
							</p>
						</div>
					</div>

					{/* PR pairs */}
					{prPairs.map((pair, index) => (
						<AnimatedSlide
							key={pair.messy.author}
							y={20}
							triggerOnView
							amount={0.3}
						>
							{/* Show right-side label on mobile before each pair */}
							{index === 0 && (
								<div className="flex lg:hidden items-center gap-2 mb-4">
									<span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
									<p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
										Same 3 PRs, standardized with PRilot
									</p>
								</div>
							)}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
								{/* Messy PR */}
								<MiniPRCard
									author={pair.messy.author}
									title={pair.messy.title}
									variant="messy"
								>
									<p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
										{pair.messy.body}
									</p>
								</MiniPRCard>

								{/* Clean PR */}
								<MiniPRCard
									author={pair.clean.author}
									title={pair.clean.title}
									variant="clean"
								>
									<div className="space-y-2">
										{pair.clean.sections.map((section) => (
											<div key={section.heading}>
												<p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">
													{section.heading}
												</p>
												<p className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-pre-line line-clamp-2">
													{section.text}
												</p>
											</div>
										))}
									</div>
								</MiniPRCard>
							</div>
						</AnimatedSlide>
					))}
				</div>
			</div>
		</section>
	);
}
