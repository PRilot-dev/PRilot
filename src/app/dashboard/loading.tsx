export default function Loading() {
	return (
		<div className="flex items-center justify-center h-screen">
			<svg
				className="h-8 w-8 animate-[spinner-rotate_1.4s_linear_infinite]"
				viewBox="0 0 32 32"
				role="img"
				aria-label="Loading"
			>
				<circle
					className="animate-[spinner-dash_1.4s_ease-in-out_infinite] stroke-gray-400 dark:stroke-gray-300"
					cx="16"
					cy="16"
					r="13"
					fill="none"
					strokeWidth="3"
					strokeLinecap="round"
					strokeDasharray="80"
					strokeDashoffset="60"
				/>
			</svg>
		</div>
	);
}
