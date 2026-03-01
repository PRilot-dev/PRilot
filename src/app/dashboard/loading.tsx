import LoadingSpinner from "@/components/skeletons/LoadingSpinner";

export default function Loading() {
	return (
		<div className="flex items-center justify-center h-[calc(100vh-8rem)]">
			<LoadingSpinner />
		</div>
	);
}
