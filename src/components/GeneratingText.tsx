"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DEEP_PHRASES = [
	"Analyzing changes",
	"Reading code",
	"Writing PR",
];

const FAST_PHRASES = ["Analyzing commits", "Writing description", "Crafting PR"];

const ALMOST_THERE = "Almost there";

interface GeneratingTextProps {
	mode: "fast" | "deep";
}

export function GeneratingText({ mode }: GeneratingTextProps) {
	const [elapsedMs, setElapsedMs] = useState(0);
	const [dotCount, setDotCount] = useState(1);

	const phrases = mode === "deep" ? DEEP_PHRASES : FAST_PHRASES;
	// Deep: 700ms per phrase (3 phrases = ~2s), then "Almost there"
	// Fast: 500ms per phrase (3 phrases = 1.5s), then "Almost there"
	const msPerPhrase = mode === "deep" ? 700 : 500;
	const almostThereThreshold = mode === "deep" ? 2100 : 1500;

	// Track elapsed time
	useEffect(() => {
		const interval = setInterval(() => {
			setElapsedMs((prev) => prev + 100);
		}, 100);
		return () => clearInterval(interval);
	}, []);

	// Animate dots quickly (every 400ms)
	useEffect(() => {
		const interval = setInterval(() => {
			setDotCount((prev) => (prev % 3) + 1);
		}, 800);
		return () => clearInterval(interval);
	}, []);

	// Determine current phrase index
	const currentPhraseIndex = useMemo(() => {
		if (elapsedMs >= almostThereThreshold) {
			return -1; // Special index for "Almost there"
		}
		return Math.min(Math.floor(elapsedMs / msPerPhrase), phrases.length - 1);
	}, [elapsedMs, almostThereThreshold, msPerPhrase, phrases.length]);

	const currentPhrase =
		currentPhraseIndex === -1 ? ALMOST_THERE : phrases[currentPhraseIndex];

	return (
		<span className="inline-flex items-center min-w-37.5">
			<Sparkles
				className="w-4 h-4 mr-2"
				style={{ animation: "sparklePulse 1s linear infinite" }}
			/>
			<span>{currentPhrase}</span>
			<span className="w-4 text-left">{".".repeat(dotCount)}</span>
		</span>
	);
}
