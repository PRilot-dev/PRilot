import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import AppProvider from "./providers";

const figtree = Figtree({
	variable: "--font-figtree",
	subsets: ["latin"],
	weight: ["600", "700", "800"],
	display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prilot.dev"),
  title: {
    default: "PRilot – AI-powered Pull Request Assistant",
    template: "%s – PRilot",
  },
  description: "Generate, review, and send pull requests automatically with AI. Collaborate seamlessly on GitHub and GitLab repositories.",
  keywords: ["PRilot", "pull request", "GitHub", "GitLab", "AI assistant", "developer tools"],
  openGraph: {
    title: "PRilot – AI-powered Pull Request Assistant",
    description: "Generate, review, and send pull requests automatically with AI.",
    url: "https://prilot.dev",
    siteName: "PRilot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PRilot – Generate perfect PRs in seconds",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRilot – AI-powered Pull Request Assistant",
    description: "Generate, review, and send pull requests automatically with AI.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://prilot.dev",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${figtree.variable} antialiased`}>
				<AppProvider>{children}</AppProvider>
        <Analytics />
        <SpeedInsights />
			</body>
		</html>
	);
}
