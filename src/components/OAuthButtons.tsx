import { Gitlab } from "lucide-react";
import { toast } from "react-toastify";
import GithubButton from "@/components/GithubButton";

export default function OAuthButtons() {
	return (
		<>
			<div className="my-4 flex items-center gap-2">
				<span className="grow h-px bg-gray-300 dark:bg-gray-600" />
				<span className="text-gray-500 dark:text-gray-400 text-sm">
					or continue with
				</span>
				<span className="grow h-px bg-gray-300 dark:bg-gray-600" />
			</div>
			<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 justify-center">
				<GithubButton />
				<button
					type="button"
					onClick={() => {
						toast.info("GitLab auth isn't available yet.");
					}}
					className="flex w-full md:w-auto justify-center items-center gap-2 px-4 py-2 border border-gray-400 rounded-xl hover:cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
				>
					<Gitlab className="w-5 h-5" />
					GitLab
				</button>
			</div>
		</>
	);
}
