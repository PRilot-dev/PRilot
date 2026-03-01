"use client";

import { ArrowBigLeftDash, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/buttons/Button";
import { PREditor } from "@/components/PREditor";
import PREditorSkeleton from "@/components/skeletons/PREditorSkeleton";
import { GeneratingText } from "@/components/ui/GeneratingText";
import { BranchSelect, LanguageSelect } from "@/components/ui/Select";
import { useAutoSavePR } from "@/hooks/useAutoSavePR";
import { useFetchPR } from "@/hooks/useFetchPR";
import { useGeneratePR } from "@/hooks/useGeneratePR";
import { usePrefetchCompare } from "@/hooks/usePrefetchCompare";
import { useRepository } from "@/hooks/useRepository";
import { useSendPR } from "@/hooks/useSendPR";
import type { PRLanguage } from "@/types/languages";
import AnimatedSlide from "./animations/AnimatedSlide";
import { PRModeModal } from "./modals/PRmodeModal";
import { PRGenerationModeSelector } from "./PRGenerationModeSelector";

interface PREditorProps {
	repoId: string;
	prId?: string;
}

export default function PREditorPageContent({
	repoId,
	prId: initialPrId,
}: PREditorProps) {
	const router = useRouter();

	// ----- State -----
	const [prId, setPrId] = useState<string | null>(initialPrId ?? null);

	const [baseBranch, setBaseBranch] = useState("");
	const [compareBranch, setCompareBranch] = useState("");

	const [language, setLanguage] = useState<PRLanguage>("English");
	const [mode, setMode] = useState<"fast" | "deep">("deep");
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [title, setTitle] = useState<string | undefined>();
	const [description, setDescription] = useState<string | undefined>();
	const [showEditOrPreview, setShowEditOrPreview] = useState<
		"edit" | "preview"
	>("edit");

	const startAutoSave = useRef(false); // To start auto saving PR in db when editing manually
	const skipNextFetch = useRef(false); // To prevent fetching PR after generating one
	const didRedirectRef = useRef(false); // To prevent duplicate branch-deleted redirects
	const branchesInitialized = useRef(false); // To prevent branch reset on store updates

	const editorRef = useRef<HTMLDivElement | null>(null);
	const autoSaveFrameRef = useRef<number | null>(null);

	// ----- Hooks -----
	const { repo, loading } = useRepository(repoId);

	const { pullRequest, loading: prFetchLoading } = useFetchPR({
		repoId,
		prId,
		skipNextFetch,
	});

	const { isGenerating, generatePR, streamingTitle, streamingDescription } =
		useGeneratePR({
			repoId,
			prId,
			baseBranch,
			compareBranch,
			language,
			mode,
			setPrId,
		});

	const { isSendingPr, providerPrUrl, sendPR } = useSendPR(repoId, prId);

	// Sync streaming values → title/description during generation
	const hasScrolledToStreamRef = useRef(false);

	useEffect(() => {
		if (isGenerating && streamingTitle) {
			setTitle(streamingTitle);

			// Scroll to editor on first token
			if (!hasScrolledToStreamRef.current) {
				hasScrolledToStreamRef.current = true;
				editorRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}
		}
	}, [isGenerating, streamingTitle]);

	useEffect(() => {
		if (isGenerating && streamingDescription) {
			setDescription(streamingDescription);
		}
	}, [isGenerating, streamingDescription]);

	useAutoSavePR({ prId, repoId, title, description, startAutoSave });
	usePrefetchCompare(repoId, baseBranch, compareBranch);

	// ----- Functions -----
	const handleGenerate = useCallback(async () => {
		startAutoSave.current = false; // suspend auto save
		skipNextFetch.current = true; // prevent fetching PR after prId is modified

		// Switch to preview immediately so tokens appear live
		setTitle("");
		setDescription("");
		setShowEditOrPreview("preview");
		hasScrolledToStreamRef.current = false;

		const {
			success,
			title: generatedTitle,
			description: generatedDescription,
		} = await generatePR();

		if (success) {
			// Set authoritative final values (overrides streaming partials)
			setTitle(generatedTitle);
			setDescription(generatedDescription);
			toast.success("✨ PR successfully generated.")
		} else {
			// Revert preview if generation failed
			setShowEditOrPreview("edit");
		}

		// Delay re-enabling auto-save to prevent immediate PATCH after PR creation
		// Double rAF ensures React has flushed all state updates and effects
		if (autoSaveFrameRef.current)
			cancelAnimationFrame(autoSaveFrameRef.current);
		autoSaveFrameRef.current = requestAnimationFrame(() => {
			autoSaveFrameRef.current = requestAnimationFrame(() => {
				startAutoSave.current = true;
			});
		});
	}, [generatePR]);

	// ----- Effects -----
	// Set default and compare branches (only once on initial load)
	useEffect(() => {
		if (!repo || branchesInitialized.current) return;
		branchesInitialized.current = true;
		setBaseBranch(repo.defaultBranch);
		setCompareBranch(
			repo.branches.length > 1
				? repo.branches[0] !== repo.defaultBranch
					? repo.branches[0]
					: repo.branches[1]
				: repo.branches[0],
		);
	}, [repo]);

	// Set PR infos if editing a draft
	useEffect(() => {
		if (!pullRequest) return;

		// Set PR infos in local state
		setPrId(pullRequest.id);
		setTitle(pullRequest.title);
		setDescription(pullRequest.description);
		setBaseBranch(pullRequest.baseBranch);
		setCompareBranch(pullRequest.compareBranch);
		setLanguage(pullRequest.language);
		setMode(pullRequest.mode);
		setShowEditOrPreview("preview");
	}, [pullRequest]);

	// Redirect if draft PR references a deleted branch
	useEffect(() => {
		if (!repo || !pullRequest || didRedirectRef.current) return;

		const branches = repo.branches;
		if (!branches.includes(pullRequest.baseBranch)) {
			didRedirectRef.current = true;
			toast.error(
				`The base branch "${pullRequest.baseBranch}" doesn't exist anymore on your GitHub repo`,
			);
			router.replace(`/dashboard/repo/${repoId}`);
			return;
		}
		if (!branches.includes(pullRequest.compareBranch)) {
			didRedirectRef.current = true;
			toast.error(
				`The compare branch "${pullRequest.compareBranch}" doesn't exist anymore on your GitHub repo`,
			);
			router.replace(`/dashboard/repo/${repoId}`);
		}
	}, [repo, pullRequest, repoId, router]);

	// Cleanup animation frame on unmount
	useEffect(() => {
		return () => {
			if (autoSaveFrameRef.current)
				cancelAnimationFrame(autoSaveFrameRef.current);
		};
	}, []);

	// ----- JSX fallbacks ------
	// Loading fallback
	if (loading || prFetchLoading) return <PREditorSkeleton />;

	// Return null if no repo (redirected to dashboard in hook already if no repo found)
	if (!repo) return null;

	// After a pull-request is sent, show link to provider PR
	if (providerPrUrl)
		return (
			<div className="flex flex-col">
				<h1 className="p-2 md:p-6 text-3xl mb-2 text-gray-900 dark:text-white">
					Generate Pull Request
				</h1>
				<AnimatedSlide
					y={40}
					triggerOnView={false}
					className="my-8 lg:my-16 flex flex-col justify-center text-start w-fit mx-auto text-xl p-4 rounded-xl border bg-white/70 dark:bg-gray-800/25 border-gray-300 dark:border-gray-700 shadow-lg"
				>
					<span className="text-2xl mb-4">
						Your Pull-Request has been successfully sent! 🚀
					</span>
					<span className="text-gray-800 dark:text-gray-200 mb-2">
						You can review it and merge it here:
					</span>
					<div className="flex gap-2">
						👉
						<Link
							href={providerPrUrl}
							target="blank"
							className="text-blue-600 dark:text-blue-500 hover:underline underline-offset-2"
						>
							{providerPrUrl}
						</Link>
					</div>
				</AnimatedSlide>
			</div>
		);

	// ----- JSX ------
	return (
		<>
			<div className="pb-6 pt-4 p-2 md:p-6 space-y-6 fade-in-fast">
				<section className="grid sm:grid-cols-3 mb-8 gap-4">
					<AnimatedSlide
						x={-20}
						triggerOnView={false}
						className="sm:col-span-2"
					>
						<h1 className="text-3xl mb-2 text-gray-900 dark:text-white">
							Generate Pull Request
						</h1>
						<p className="text-gray-600 dark:text-gray-400">
							Select branches and let AI generate a comprehensive PR description
						</p>
					</AnimatedSlide>
					<AnimatedSlide x={20} triggerOnView={false}>
						<LanguageSelect value={language} onChange={setLanguage} />
					</AnimatedSlide>
				</section>

				<div className="flex flex-col">
					{/* Branch selectors */}
					<section>
						<div className="relative grid md:grid-cols-2 gap-8 md:gap-20">
							<AnimatedSlide x={-20} triggerOnView={false}>
								<BranchSelect
									label="Base Branch"
									value={baseBranch}
									onChange={setBaseBranch}
									options={repo.branches}
								/>
							</AnimatedSlide>
							<div className="absolute hidden md:flex inset-0 w-full h-full justify-center items-center pt-8 pointer-events-none">
								<ArrowBigLeftDash size={28} />
							</div>
							<AnimatedSlide x={20} triggerOnView={false}>
								<BranchSelect
									label="Compare Branch"
									value={compareBranch}
									onChange={setCompareBranch}
									options={repo.branches}
								/>
							</AnimatedSlide>
						</div>
					</section>

					{/* AI generation mode selector and button */}
					<section className="my-16">
						{/* Mode selector */}
						<AnimatedSlide
							x={-20}
							triggerOnView={false}
							className="sm:w-1/2 mx-auto mb-8"
						>
							<PRGenerationModeSelector
								mode={mode}
								setMode={setMode}
								onHelpClick={() => setIsModalOpen(true)}
							/>
						</AnimatedSlide>
						{/* Generate button */}
						<AnimatedSlide
							y={20}
							triggerOnView={false}
							className="sm:w-1/2 mx-auto"
						>
							<Button
								onClick={handleGenerate}
								disabled={!compareBranch || isGenerating || isSendingPr}
								className="h-auto w-full py-2 bg-gray-900 text-white dark:bg-gray-200 dark:text-black hover:bg-gray-700 hover:dark:bg-gray-300 shadow-lg group disabled:animate-pulse"
							>
								<span className="flex items-center group-hover:scale-110 transition">
									{isGenerating ? (
										<GeneratingText mode={mode} />
									) : (
										<>
											<Sparkles className="w-4 h-4 mr-2" />
											Generate with AI
										</>
									)}
								</span>
							</Button>
						</AnimatedSlide>
					</section>

					{/* PR Editor */}
					<AnimatedSlide
						y={20}
						triggerOnView={false}
						ref={editorRef}
					>
						<PREditor
							title={title}
							description={description}
							showEditOrPreview={showEditOrPreview}
							setTitle={(v) => {
								startAutoSave.current = true;
								setTitle(v);
							}}
							setDescription={(v) => {
								startAutoSave.current = true;
								setDescription(v);
							}}
							setShowEditOrPreview={setShowEditOrPreview}
							onSend={sendPR}
							isSendingPr={isSendingPr}
						/>
					</AnimatedSlide>
				</div>
			</div>

			{/* Mode Explanation Modal */}
			<PRModeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
		</>
	);
}
