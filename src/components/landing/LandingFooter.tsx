import Link from "next/link";

export default function LandingFooter() {
	return (
		<footer className="bg-gray-50 dark:bg-zinc-950 border-t border-gray-200 dark:border-gray-800">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid md:grid-cols-4 gap-8">
					{/* Brand */}
					<div>
						<Link
							href="/"
							className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
						>
							PRilot
						</Link>
						<p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-64">
							AI-powered pull request generation. From branch diff to PR in
							seconds.
						</p>
					</div>

					{/* Product links */}
					<div>
						<h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
							Product
						</h4>
						<ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
							<li>
								<a
									href="#features"
									className="hover:text-gray-900 hover:dark:text-white transition-colors"
								>
									Features
								</a>
							</li>
							<li>
								<a
									href="#how-it-works"
									className="hover:text-gray-900 hover:dark:text-white transition-colors"
								>
									How It Works
								</a>
							</li>
							<li>
								<a
									href="#example"
									className="hover:text-gray-900 hover:dark:text-white transition-colors"
								>
									Example
								</a>
							</li>
						</ul>
					</div>

					{/* Account links */}
					<div>
						<h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
							Account
						</h4>
						<ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
							<li>
								<Link
									href="/login"
									className="hover:text-gray-900 hover:dark:text-white transition-colors"
								>
									Log in
								</Link>
							</li>
							<li>
								<Link
									href="/signup"
									className="hover:text-gray-900 hover:dark:text-white transition-colors"
								>
									Sign up
								</Link>
							</li>
						</ul>
					</div>

				{/* Legal links */}
				<div>
					<h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
						Legal
					</h4>
					<ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
						<li>
							<Link
								href="/privacy"
								className="hover:text-gray-900 hover:dark:text-white transition-colors"
							>
								Privacy Policy
							</Link>
						</li>
						<li>
							<Link
								href="/terms"
								className="hover:text-gray-900 hover:dark:text-white transition-colors"
							>
								Terms of Service
							</Link>
						</li>
					</ul>
				</div>
				</div>

				{/* Bottom bar */}
				<div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-400 dark:text-gray-500">
					&copy; {new Date().getFullYear()} PRilot. All rights reserved.
				</div>
			</div>
		</footer>
	);
}
