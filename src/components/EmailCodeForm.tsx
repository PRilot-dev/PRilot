import { Mail } from "lucide-react";
import FormInput from "@/components/FormInput";

interface EmailCodeFormProps {
	email: string;
	setEmail: (value: string) => void;
	loading: boolean;
	onSubmit: (e: React.FormEvent) => void;
	description: string;
}

export default function EmailCodeForm({
	email,
	setEmail,
	loading,
	onSubmit,
	description,
}: EmailCodeFormProps) {
	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-4 text-left">
			<FormInput
				id="code-email"
				label="Email"
				type="email"
				placeholder="you@example.com"
				value={email}
				onChange={setEmail}
				required
			/>
			<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
				{description}
			</p>
			<button
				type="submit"
				disabled={loading}
				className="mt-2 w-full py-2 bg-blue-500 text-white rounded-xl font-semibold hover:cursor-pointer hover:bg-blue-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
			>
				<Mail className="w-4 h-4" />
				{loading ? "Sending..." : "Send code"}
			</button>
		</form>
	);
}
