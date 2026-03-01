"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import AppNavbar from "@/components/navbar/AppNavbar";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { InstallationsProvider } from "@/contexts/InstallationContext";
import { ReposProvider } from "@/contexts/ReposContext";
import { useUser } from "@/contexts/UserContext";

interface DashboardLayoutProps {
	children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	const router = useRouter();
	const { user, loading } = useUser();

	// Redirect to login if not authenticated
	useEffect(() => {
		if (!loading && !user) {
			router.replace("/login");
		}
	}, [loading, user, router]);

	// Show skeleton until user data is ready
	if (loading || !user) return <DashboardSkeleton />;

	return (
		<InstallationsProvider>
			<ReposProvider>
				<div className="flex flex-col h-screen bg-linear-to-b from-gray-50 to-blue-100/50 dark:from-zinc-950 dark:to-[#13131d]">
					<AppNavbar />
					<div className="flex-1 overflow-y-auto">
						<main className="pt-20 mx-auto max-w-7xl w-full">
							{children}
						</main>
					</div>
				</div>
			</ReposProvider>
		</InstallationsProvider>
	);
}
