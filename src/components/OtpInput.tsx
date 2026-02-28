"use client";

import { useCallback, useEffect, useRef } from "react";

interface OtpInputProps {
	value: string;
	onChange: (value: string) => void;
	onComplete: (code: string) => void;
	disabled?: boolean;
	length?: number;
}

export default function OtpInput({
	value,
	onChange,
	onComplete,
	disabled = false,
	length = 6,
}: OtpInputProps) {
	const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
	const digits = Array.from({ length }, (_, i) => value[i] ?? "");

	const focusInput = useCallback(
		(index: number) => {
			const clamped = Math.max(0, Math.min(index, length - 1));
			inputsRef.current[clamped]?.focus();
		},
		[length],
	);

	// Auto-submit when all digits are filled
	useEffect(() => {
		if (value.length === length && /^\d+$/.test(value)) {
			onComplete(value);
		}
	}, [value, length, onComplete]);

	const handleChange = (index: number, char: string) => {
		if (disabled) return;

		// Only accept digits
		const digit = char.replace(/\D/g, "").slice(-1);
		if (!digit) return;

		const next = digits.slice();
		next[index] = digit;
		const newValue = next.join("");
		onChange(newValue);

		// Move focus to next input
		if (index < length - 1) {
			focusInput(index + 1);
		}
	};

	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (disabled) return;

		if (e.key === "Backspace") {
			e.preventDefault();
			const next = digits.slice();
			if (digits[index] !== "") {
				// Clear current digit
				next[index] = "";
				onChange(next.join(""));
			} else if (index > 0) {
				// Move back and clear previous digit
				next[index - 1] = "";
				onChange(next.join(""));
				focusInput(index - 1);
			}
		} else if (e.key === "ArrowLeft" && index > 0) {
			e.preventDefault();
			focusInput(index - 1);
		} else if (e.key === "ArrowRight" && index < length - 1) {
			e.preventDefault();
			focusInput(index + 1);
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		if (disabled) return;

		const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
		if (!pasted) return;

		onChange(pasted);
		focusInput(Math.min(pasted.length, length - 1));
	};

	return (
		<div className="flex justify-center gap-2">
			{digits.map((digit, i) => (
				<input
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed-position OTP digit slots never reorder
					key={i}
					ref={(el) => {
						inputsRef.current[i] = el;
					}}
					type="text"
					inputMode="numeric"
					autoComplete={i === 0 ? "one-time-code" : "off"}
					maxLength={1}
					value={digit}
					disabled={disabled}
					onChange={(e) => handleChange(i, e.target.value)}
					onKeyDown={(e) => handleKeyDown(i, e)}
					onPaste={handlePaste}
					onFocus={(e) => e.target.select()}
					className="w-11 h-13 text-center text-xl font-semibold border rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 transition"
				/>
			))}
		</div>
	);
}
