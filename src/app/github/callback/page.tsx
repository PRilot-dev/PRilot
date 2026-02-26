"use client";

import { Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

export default function GitHubCallbackPage() {
	const router = useRouter();
	const connectOnce = useRef(false);

	useEffect(() => {
    // Prevent double calls
		if (connectOnce.current) return;
		connectOnce.current = true;

		const handleCallback = async () => {
      // Get installation_id from URL params
			const params = new URLSearchParams(window.location.search);
			const installationId = params.get("installation_id");

			try {
				if (!installationId) {
					throw new Error("No installation ID found in URL");
				}

				const res = await fetch("/api/installations/github", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ installationId }),
				});

				if (!res.ok) {
					const data = await res.json();
					if (res.status === 409) {
						throw new Error(
							data.error || "This installation is already linked to another account",
						);
					}
					throw new Error(data.error || "Failed to register GitHub installation");
				}

				toast.success("GitHub installation successful! ✨");
			} catch (error) {
				console.error(error);
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to register GitHub installation",
				);
			} finally {
				router.push("/dashboard");
			}
		};

		handleCallback();
	}, [router]);

	return (
		<div className="flex flex-col md:flex-row gap-4 items-center justify-center h-screen px-4 text-center">
			<Github size={40} className="animate-pulse" />
			<p className="text-2xl animate-pulse">
				Connecting your GitHub account...
			</p>
		</div>
	);
}
