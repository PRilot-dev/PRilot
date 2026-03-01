import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import AppProvider from "./providers";
import { Analytics } from "@vercel/analytics/next"

const figtree = Figtree({
	variable: "--font-figtree",
	subsets: ["latin"],
	weight: ["600", "700", "800"],
	display: "swap",
});

export const metadata: Metadata = {
  title: "PRilot – AI-powered Pull Request Assistant",
  description: "Generate, review, and send pull requests automatically with AI. Collaborate seamlessly on GitHub and GitLab repositories.",
  keywords: ["PRilot", "pull request", "GitHub", "GitLab", "AI assistant", "developer tools"],
  openGraph: {
    title: "PRilot – AI-powered Pull Request Assistant",
    description: "Generate, review, and send pull requests automatically with AI.",
    url: "https://prilot.example.com",
    siteName: "PRilot",
    images: [
      {
        url: "https://prilot.example.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "PRilot Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
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
			</body>
		</html>
	);
}
