import { Autocomplete } from "@base-ui/react/autocomplete";
import { createFileRoute } from "@tanstack/react-router";
import {
	Bookmark,
	Loader2,
	Play,
	Search,
	Sparkles,
	Square,
	Star,
	X,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import RarityTag from "@/components/RarityTag";
import SeedFinderWorker from "@/data/find-seed?worker";
import {
	getCatStageImagePath,
	useCatDatabase,
	useSeedBookmarks,
} from "@/utils";

export const Route = createFileRoute("/seed-finder")({
	component: SeedFinder,
});

interface CatOption {
	id: number;
	name: string;
	rarity: number;
}

// Detect number of CPU cores (limit to reasonable range)
const NUM_WORKERS = Math.min(navigator.hardwareConcurrency || 4, 8);
const UINT32_MAX = 0x100000000;

interface ProgressMsg {
	type: "progress";
	seedsChecked: number;
	totalSeeds: number;
	progress: number;
	seedsPerSecond: number;
	etaSeconds: number;
	currentEvent: string;
	workerId: number;
}
interface MatchMsg {
	type: "match";
	seed: number;
	eventId: string | number;
	eventName: string;
	totalMatches: number;
	workerId: number;
}
interface CompleteMsg {
	type: "complete";
	seedsChecked: number;
	timeElapsed: number;
	matchingSeeds: number[];
	workerId: number;
}
interface ErrorMsg {
	type: "error";
	message: string;
}
interface StoppedMsg {
	type: "stopped";
	seedsChecked: number;
	workerId: number;
	matchingSeeds: number[];
}
type WorkerMsg = ProgressMsg | MatchMsg | CompleteMsg | ErrorMsg | StoppedMsg;

interface WorkerProgress {
	seedsChecked: number;
	seedsPerSecond: number;
	currentEvent: string;
}

interface SearchState {
	status: "idle" | "searching" | "complete" | "stopped" | "error";
	workerProgress: Map<number, WorkerProgress>;
	matchingSeeds: number[];
	eventName?: string;
	error?: string;
	activeWorkers: number;
	totalSeedsChecked: number;
	searchDuration: number;
}

function SeedBookmarkButtons({
	seed,
	size = "large",
}: {
	seed: number;
	size?: "large" | "small";
}) {
	const { setMasterBookmark, addBookmark } = useSeedBookmarks();

	const handleSetMaster = () => setMasterBookmark(seed);
	const handleAddBookmark = () => {
		const name = prompt("Enter bookmark name:");
		if (name?.trim()) addBookmark(name.trim(), seed);
	};

	const buttonClass =
		size === "small"
			? "p-1.5 rounded"
			: "px-4 py-2 rounded-lg flex items-center gap-2 font-medium";

	return (
		<div
			className={
				size === "small"
					? "flex gap-1 flex-shrink-0"
					: "flex gap-2 justify-center"
			}
		>
			<button
				type="button"
				onClick={handleSetMaster}
				className={`bg-amber-500 hover:bg-amber-600 text-white transition-colors ${buttonClass}`}
				title="Set as Master"
			>
				<Star size={size === "small" ? 14 : 18} />
				{size === "large" && <span>Set as Master</span>}
			</button>
			<button
				type="button"
				onClick={handleAddBookmark}
				className={`bg-indigo-500 hover:bg-indigo-600 text-white transition-colors ${buttonClass}`}
				title="Add Bookmark"
			>
				<Bookmark size={size === "small" ? 14 : 18} />
				{size === "large" && <span>Add Bookmark</span>}
			</button>
		</div>
	);
}

function SeedFinder() {
	const catDatabase = useCatDatabase();
	const [selectedCats, setSelectedCats] = useState<number[]>([]);
	const [searchInput, setSearchInput] = useState("");
	const [searchState, setSearchState] = useState<SearchState>({
		status: "idle",
		workerProgress: new Map(),
		matchingSeeds: [],
		activeWorkers: 0,
		totalSeedsChecked: 0,
		searchDuration: 0,
	});
	const inputRef = useRef<HTMLInputElement>(null);
	const workersRef = useRef<Worker[]>([]);

	const searchId = useId();

	const startSearch = () => {
		if (!catDatabase.data) return;

		// Initialize worker progress tracking
		const workerProgress = new Map<number, WorkerProgress>();
		for (let i = 0; i < NUM_WORKERS; i++) {
			workerProgress.set(i, {
				seedsChecked: 0,
				seedsPerSecond: 0,
				currentEvent: "",
			});
		}

		setSearchState({
			status: "searching",
			workerProgress,
			matchingSeeds: [],
			activeWorkers: NUM_WORKERS,
			totalSeedsChecked: 0,
			searchDuration: 0,
		});

		// Create and start workers
		workersRef.current = [];
		const seedsPerWorker = Math.floor(UINT32_MAX / NUM_WORKERS);

		for (let i = 0; i < NUM_WORKERS; i++) {
			const worker = new SeedFinderWorker();
			workersRef.current.push(worker);

			const seedStart = i * seedsPerWorker;
			const seedEnd =
				i === NUM_WORKERS - 1 ? UINT32_MAX : (i + 1) * seedsPerWorker;

			worker.onmessage = (msg: MessageEvent<WorkerMsg>) => {
				const data = msg.data;
				switch (data.type) {
					case "progress": {
						const progressData = data;
						setSearchState((prev) => {
							const newProgress = new Map(prev.workerProgress);
							newProgress.set(progressData.workerId, {
								seedsChecked: progressData.seedsChecked,
								seedsPerSecond: progressData.seedsPerSecond,
								currentEvent: progressData.currentEvent,
							});
							return {
								...prev,
								status: "searching",
								workerProgress: newProgress,
							};
						});
						break;
					}

					case "match": {
						const matchData = data;
						// Add matching seed to the list
						setSearchState((prev) => ({
							...prev,
							matchingSeeds: [...prev.matchingSeeds, matchData.seed],
							eventName: matchData.eventName,
						}));
						break;
					}

					case "complete": {
						const completeData = data;
						// Worker finished its portion
						setSearchState((prev) => {
							const newActiveWorkers = prev.activeWorkers - 1;
							const newTotalChecked =
								prev.totalSeedsChecked + completeData.seedsChecked;
							const newMatchingSeeds = [
								...prev.matchingSeeds,
								...completeData.matchingSeeds.filter(
									(seed) => !prev.matchingSeeds.includes(seed),
								),
							];

							if (newActiveWorkers === 0) {
								// All workers complete
								return {
									status: "complete",
									workerProgress: new Map(),
									matchingSeeds: newMatchingSeeds,
									eventName: prev.eventName,
									activeWorkers: 0,
									totalSeedsChecked: newTotalChecked,
									searchDuration: completeData.timeElapsed,
								};
							}
							return {
								...prev,
								activeWorkers: newActiveWorkers,
								totalSeedsChecked: newTotalChecked,
								matchingSeeds: newMatchingSeeds,
							};
						});
						break;
					}

					case "error": {
						const errorData = data;
						// Stop all workers on error
						workersRef.current.forEach((w) => {
							w.postMessage({ type: "stop" });
						});
						setSearchState((prev) => ({
							status: "error",
							error: errorData.message,
							workerProgress: new Map(),
							matchingSeeds: [],
							activeWorkers: 0,
							totalSeedsChecked: prev.totalSeedsChecked,
							searchDuration: 0,
						}));
						break;
					}

					case "stopped": {
						const stoppedData = data;
						setSearchState((prev) => {
							const newActiveWorkers = prev.activeWorkers - 1;
							const newMatchingSeeds = [
								...prev.matchingSeeds,
								...stoppedData.matchingSeeds.filter(
									(seed) => !prev.matchingSeeds.includes(seed),
								),
							];

							if (newActiveWorkers === 0) {
								return {
									status: "stopped",
									workerProgress: new Map(),
									matchingSeeds: newMatchingSeeds,
									eventName: prev.eventName,
									activeWorkers: 0,
									totalSeedsChecked: prev.totalSeedsChecked,
									searchDuration: 0,
								};
							}
							return { ...prev, activeWorkers: newActiveWorkers };
						});
						break;
					}
				}
			};

			worker.postMessage({
				type: "start",
				catDatabase: catDatabase.data,
				selectedCatIds: selectedCats,
				seedStart,
				seedEnd,
				workerId: i,
			});
		}
	};

	const stopSearch = () => {
		workersRef.current.forEach((worker) => {
			worker.postMessage({ type: "stop" });
		});
	};

	const autocompleteItems = Object.entries(catDatabase.data?.cats ?? {})
		.filter(([_id, cat]) =>
			cat.name.some((name) =>
				name.toLowerCase().includes(searchInput.toLowerCase()),
			),
		)
		.map(([id, cat]) => ({
			id: +id,
			name: cat.name[0],
			rarity: cat.rarity,
		}));

	const addCat = (catId: number) => {
		if (selectedCats.length < 10 && !selectedCats.includes(catId)) {
			setSelectedCats([...selectedCats, catId]);
			setSearchInput("");
			inputRef.current?.focus();
		}
	};

	const removeCat = (index: number) => {
		setSelectedCats(selectedCats.filter((_, i) => i !== index));
	};

	const getCatInfo = (catId: number) => {
		if (!catDatabase.data) return null;
		const cat = catDatabase.data.cats[catId];
		return cat
			? {
					id: catId,
					name: cat.name[0],
					rarity: cat.rarity,
				}
			: null;
	};

	if (catDatabase.isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-4 md:p-8">
				<div className="max-w-4xl mx-auto">
					<div className="text-center text-slate-600 dark:text-slate-400">
						Loading cat database...
					</div>
				</div>
			</div>
		);
	}

	if (catDatabase.error) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-4 md:p-8">
				<div className="max-w-4xl mx-auto">
					<div className="text-center text-red-600 dark:text-red-400">
						Error loading cat database
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-4 md:p-8">
			<div className="max-w-4xl mx-auto flex flex-col gap-6">
				{/* Header */}
				<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 p-6">
					<div className="flex items-center gap-3 mb-2">
						<Sparkles className="text-amber-500" size={28} />
						<h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
							Seed Finder
						</h1>
					</div>
					<p className="text-slate-600 dark:text-slate-400">
						Use 5 rare tickets and enter the cats that you get into this tool.
						It will look at every seed to find the one that matches your cat
						sequence. If it found more than one seed, roll another cat and try
						again. If it can't find your seed after 7 or 8 cats, try{" "}
						<a
							href="https://bc-seek.godfat.org/seek"
							target="_blank"
							rel="noopener"
							className="text-indigo-600 dark:text-indigo-400 underline"
						>
							Godfat
						</a>{" "}
						instead and send me a note so I can fix it.
					</p>
				</div>

				{/* Autocomplete Input */}
				<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 p-6">
					<div className="mb-4">
						<Autocomplete.Root
							filteredItems={autocompleteItems}
							inputRef={inputRef}
							autoHighlight={true}
							onValueChange={(value, details) =>
								details.reason === "item-press" && addCat(+value)
							}
						>
							{/** biome-ignore lint/a11y/noLabelWithoutControl: baseui adds a117 */}
							<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
								Search and Add Cats ({selectedCats.length}/10)
								<div className="relative">
									<Search
										id={searchId}
										className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
										size={20}
									/>
									<Autocomplete.Input
										value={searchInput}
										onChange={(e) => setSearchInput(e.target.value)}
										placeholder="Type cat name..."
										disabled={selectedCats.length >= 10}
										className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
									/>
								</div>
							</label>

							{searchInput.length > 1 && (
								<Autocomplete.Portal>
									<Autocomplete.Positioner align="start" sideOffset={8}>
										<Autocomplete.Popup className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-80 overflow-y-auto">
											<Autocomplete.Empty>
												<div className="p-4 text-slate-500 dark:text-slate-400">
													No cats found.
												</div>
											</Autocomplete.Empty>
											<Autocomplete.List className="bg-slate-800 rounded">
												{(cat: CatOption) => (
													<Autocomplete.Item value={cat.id} key={cat.id}>
														<button
															key={cat.id}
															type="button"
															onClick={() => addCat(cat.id)}
															className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
														>
															<img
																src={getCatStageImagePath(cat.id, 0)}
																alt={cat.name}
																className="w-12 h-12 object-contain"
																onError={(e) => {
																	e.currentTarget.style.display = "none";
																}}
															/>
															<div className="flex-1">
																<div className="font-medium text-slate-800 dark:text-slate-100">
																	{cat.name}
																</div>
																<div className="text-xs text-slate-500 dark:text-slate-400">
																	ID: {cat.id}
																</div>
															</div>
															<RarityTag rarity={cat.rarity} />
														</button>
													</Autocomplete.Item>
												)}
											</Autocomplete.List>
										</Autocomplete.Popup>
									</Autocomplete.Positioner>
								</Autocomplete.Portal>
							)}
						</Autocomplete.Root>
					</div>

					<h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
						Selected Cats
					</h2>

					{selectedCats.length === 0 ? (
						<div className="text-center py-12 text-slate-400 dark:text-slate-500">
							No cats selected yet. Use the search above to add cats.
						</div>
					) : (
						<div className="space-y-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
							{selectedCats.map((catId, index) => {
								const catInfo = getCatInfo(catId);
								if (!catInfo) return null;

								return (
									<div key={catId} className="flex items-center gap-3">
										{/* Position Number */}
										<div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
											{index + 1}
										</div>

										{/* Cat Image */}
										<img
											src={getCatStageImagePath(catId, 0)}
											alt={catInfo.name}
											className="w-16 h-16 object-contain"
											onError={(e) => {
												e.currentTarget.style.display = "none";
											}}
										/>

										{/* Cat Info */}
										<div className="flex-1">
											<div className="font-semibold text-slate-800 dark:text-slate-100">
												{catInfo.name}
											</div>
											<div className="text-xs text-slate-500 dark:text-slate-400">
												ID: {catId}
											</div>
										</div>

										<RarityTag rarity={catInfo.rarity} />

										{/* Remove Button */}
										<button
											type="button"
											onClick={() => removeCat(index)}
											className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
											title="Remove"
										>
											<X size={18} />
										</button>
									</div>
								);
							})}
						</div>
					)}

					{selectedCats.length === 10 && (
						<div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-center font-medium">
							✓ All 10 cats selected! You can now proceed with your seed search.
						</div>
					)}
				</div>

				{/* Search Controls & Results */}
				<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
							Seed Search
						</h2>
						{searchState.status === "searching" ? (
							<button
								type="button"
								onClick={stopSearch}
								className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
							>
								<Square size={18} />
								Stop
							</button>
						) : (
							<button
								type="button"
								onClick={startSearch}
								disabled={selectedCats.length < 5 || !catDatabase.data}
								className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
							>
								<Play size={18} />
								Find Seed
							</button>
						)}
					</div>

					{/* Status Messages */}
					{searchState.status === "idle" && selectedCats.length < 5 && (
						<div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 text-center">
							Please select at least 5 cats to start searching.
						</div>
					)}

					{searchState.status === "idle" && selectedCats.length >= 5 && (
						<div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-400 text-center">
							Ready to search! Click "Find Seed" to begin.
						</div>
					)}

					{/* Progress Display */}
					{searchState.status === "searching" &&
						(() => {
							// Aggregate stats from all workers (including completed ones)
							const activeSeedsChecked = Array.from(
								searchState.workerProgress.values(),
							).reduce((sum, p) => sum + p.seedsChecked, 0);
							const totalSeedsChecked =
								searchState.totalSeedsChecked + activeSeedsChecked;
							const totalSpeed = Array.from(
								searchState.workerProgress.values(),
							).reduce((sum, p) => sum + p.seedsPerSecond, 0);
							const progress = (totalSeedsChecked / UINT32_MAX) * 100;
							const remainingSeeds = UINT32_MAX - totalSeedsChecked;
							const etaSeconds =
								totalSpeed > 0 ? remainingSeeds / totalSpeed : 0;
							const currentEvent =
								Array.from(searchState.workerProgress.values())[0]
									?.currentEvent || "";

							return (
								<div className="space-y-4">
									<div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
										<Loader2
											className="animate-spin text-indigo-600"
											size={24}
										/>
										<div className="flex-1">
											<div className="font-medium text-indigo-700 dark:text-indigo-300">
												Searching with {NUM_WORKERS} parallel workers...
											</div>
											{currentEvent && (
												<div className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
													Event: {currentEvent}
												</div>
											)}
										</div>
									</div>

									{totalSeedsChecked > 0 && (
										<>
											{/* Progress Bar */}
											<div className="space-y-2">
												<div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
													<span>Progress</span>
													<span>{progress.toFixed(4)}%</span>
												</div>
												<div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
													<div
														className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
														style={{ width: `${Math.min(progress, 100)}%` }}
													/>
												</div>
											</div>

											{/* Stats Grid */}
											<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
												<div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
													<div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
														Seeds Checked
													</div>
													<div className="font-semibold text-slate-800 dark:text-slate-100">
														{totalSeedsChecked.toLocaleString()}
													</div>
												</div>
												<div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
													<div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
														Combined Speed
													</div>
													<div className="font-semibold text-slate-800 dark:text-slate-100">
														{totalSpeed.toLocaleString(undefined, {
															maximumFractionDigits: 0,
														})}{" "}
														seeds/s
													</div>
												</div>
												<div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
													<div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
														ETA
													</div>
													<div className="font-semibold text-slate-800 dark:text-slate-100">
														{etaSeconds > 3600
															? `${(etaSeconds / 3600).toFixed(1)} hours`
															: etaSeconds > 60
																? `${(etaSeconds / 60).toFixed(1)} min`
																: `${etaSeconds.toFixed(0)} sec`}
													</div>
												</div>
											</div>
										</>
									)}
								</div>
							);
						})()}

					{/* Complete - Display Results */}
					{searchState.status === "complete" && (
						<div className="space-y-4">
							{searchState.matchingSeeds.length === 0 ? (
								<div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl text-orange-700 dark:text-orange-400 text-center">
									No matching seed found. Please verify your cat sequence is
									correct.
								</div>
							) : searchState.matchingSeeds.length === 1 ? (
								<div className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl">
									<div className="text-center mb-4">
										<div className="text-4xl mb-2">🎉</div>
										<h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">
											Seed Found!
										</h3>
										<div className="text-green-600 dark:text-green-400 text-sm">
											Search completed in{" "}
											{(searchState.searchDuration / 1000).toFixed(2)} seconds
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
											<div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
												Your Seed
											</div>
											<div className="text-3xl font-bold text-green-700 dark:text-green-300">
												{searchState.matchingSeeds[0]}
											</div>
										</div>
										<div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
											<div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
												Event
											</div>
											<div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
												{searchState.eventName}
											</div>
										</div>
									</div>
									<div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg text-sm">
										<div className="text-slate-500 dark:text-slate-400">
											Seeds checked
										</div>
										<div className="font-semibold text-slate-800 dark:text-slate-100">
											{searchState.totalSeedsChecked.toLocaleString()}
										</div>
									</div>
									<div className="mt-4">
										<SeedBookmarkButtons seed={searchState.matchingSeeds[0]} />
									</div>
								</div>
							) : (
								<div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl">
									<div className="text-center mb-4">
										<div className="text-4xl mb-2">⚠️</div>
										<h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300 mb-2">
											Multiple Seeds Found
										</h3>
										<div className="text-amber-600 dark:text-amber-400 text-sm mb-3">
											Found {searchState.matchingSeeds.length} seeds matching
											your sequence
										</div>
										<div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
											To identify your exact seed, please add more cats to your
											selected list and search again.
										</div>
									</div>

									<div className="mb-4">
										<div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
											Matching Seeds:
										</div>
										<div className="bg-white dark:bg-slate-800 rounded-lg p-4 max-h-60 overflow-y-auto">
											<div className="space-y-2">
												{searchState.matchingSeeds.map((seed, index) => (
													<div
														key={seed}
														className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
													>
														<span className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
															#{index + 1}
														</span>
														<span className="font-mono font-semibold text-slate-800 dark:text-slate-100 flex-1">
															{seed}
														</span>
														<SeedBookmarkButtons seed={seed} size="small" />
													</div>
												))}
											</div>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-3">
										<div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-sm">
											<div className="text-slate-500 dark:text-slate-400">
												Seeds checked
											</div>
											<div className="font-semibold text-slate-800 dark:text-slate-100">
												{searchState.totalSeedsChecked.toLocaleString()}
											</div>
										</div>
										<div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-sm">
											<div className="text-slate-500 dark:text-slate-400">
												Search time
											</div>
											<div className="font-semibold text-slate-800 dark:text-slate-100">
												{(searchState.searchDuration / 1000).toFixed(2)}s
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Stopped */}
					{searchState.status === "stopped" && (
						<div className="space-y-4">
							<div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-700 dark:text-yellow-400 text-center">
								Search stopped by user.
								{searchState.matchingSeeds.length > 0 && (
									<div className="mt-2 text-sm">
										Found {searchState.matchingSeeds.length} partial{" "}
										{searchState.matchingSeeds.length === 1
											? "match"
											: "matches"}{" "}
										before stopping.
									</div>
								)}
							</div>

							{searchState.matchingSeeds.length > 0 && (
								<div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
									<div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
										Partial Results:
									</div>
									<div className="space-y-2 max-h-60 overflow-y-auto">
										{searchState.matchingSeeds.map((seed, index) => (
											<div
												key={seed}
												className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded"
											>
												<span className="text-sm text-slate-500 dark:text-slate-400">
													#{index + 1}
												</span>
												<span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
													{seed}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Error */}
					{searchState.status === "error" && (
						<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-center">
							Error: {searchState.error}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
