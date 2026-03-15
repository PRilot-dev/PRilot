"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useUser } from "@/contexts/UserContext";

type AuthMode = "password" | "code";

export function useAuth() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, setUser, loading: userLoading } = useUser();

	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");

	// Email code state
	const [mode, setMode] = useState<AuthMode>(
		searchParams.get("mode") === "password" ? "password" : "code",
	);
	const [codeSent, setCodeSent] = useState(false);
	const [code, setCode] = useState("");

	// Route guard — redirect to dashboard when user is authenticated
	useEffect(() => {
		if (!userLoading && user) {
			router.replace("/dashboard");
		}
	}, [userLoading, user, router]);

	// Send email code
	const handleSendCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await fetch("/api/auth/email-code/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Failed to send code");
				setLoading(false);
				return;
			}

			setCodeSent(true);
			toast.success("Code sent! Check your email.");
		} catch {
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	// Verify email code (triggered automatically when 6 digits entered)
	const handleVerifyCode = async (fullCode: string) => {
		if (loading) return;
		setLoading(true);

		try {
			const res = await fetch("/api/auth/email-code/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, code: fullCode }),
				credentials: "include",
			});

			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Verification failed");
				setCode("");
				setLoading(false);
				return;
			}

			setUser(data.user);
			toast.success(data.isNewUser ? "Welcome to PRilot!" : "Welcome back!");
		} catch {
			toast.error("An unexpected error occurred");
			setCode("");
		} finally {
			setLoading(false);
		}
	};

	// Reset code state (for "Use a different email" and mode switching)
	const resetCode = () => {
		setCodeSent(false);
		setCode("");
	};

	return {
		email,
		setEmail,
		mode,
		setMode,
		code,
		setCode,
		codeSent,
		loading,
		setLoading,
		user,
		userLoading,
		setUser,
		handleSendCode,
		handleVerifyCode,
		resetCode,
	};
}
