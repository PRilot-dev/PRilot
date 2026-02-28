import OtpInput from "@/components/OtpInput";

interface CodeVerificationProps {
	email: string;
	code: string;
	setCode: (value: string) => void;
	loading: boolean;
	onVerify: (code: string) => void;
	onResend: (e: React.FormEvent) => void;
	onChangeEmail: () => void;
}

export default function CodeVerification({
	email,
	code,
	setCode,
	loading,
	onVerify,
	onResend,
	onChangeEmail,
}: CodeVerificationProps) {
	return (
		<div className="flex flex-col gap-4">
			<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
				Enter the 6-digit code sent to <strong>{email}</strong>
			</p>
			<OtpInput
				value={code}
				onChange={setCode}
				onComplete={onVerify}
				disabled={loading}
			/>
			{loading && (
				<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
					Verifying...
				</p>
			)}
			<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
				Didn&apos;t receive the sign-in code?{" "}
				<button
					type="button"
					onClick={(e) => {
						setCode("");
						onResend(e);
					}}
					disabled={loading}
					className="text-blue-600 dark:text-blue-400 hover:underline hover:cursor-pointer disabled:opacity-50"
				>
					Send a new code
				</button>
			</p>
			<button
				type="button"
				onClick={onChangeEmail}
				className="text-sm text-gray-500 dark:text-gray-400 hover:underline hover:cursor-pointer"
			>
				Use a different email
			</button>
		</div>
	);
}
