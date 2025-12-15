import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, Crown, Sparkles } from "lucide-react";
import { useEffect, useId, useState } from "react";
import RarityTag from "@/components/RarityTag";
import { useDialogs } from "@/contexts/DialogContext";
import { Rarity, rollTracks } from "../data/battle-cats-gacha";
import { type CatDatabase, createGachaEvent } from "../data/gacha-data";
import {
	getCatTierRank,
	lookupCat,
	useCatDatabase,
	useCatSeed,
} from "../utils";

export const Route = createFileRoute("/uber-planner")({ component: App });

function extractUbers(
	catDatabase: CatDatabase,
	tracks: ReturnType<typeof rollTracks>,
) {
	return {
		trackA: tracks.trackA
			.map((cat, index) => ({ index, ...cat }))
			.filter((cat) => lookupCat(catDatabase, cat.catId).rarity >= Rarity.Uber),
		trackB: tracks.trackB
			.map((cat, index) => ({ index, ...cat }))
			.filter((cat) => lookupCat(catDatabase, cat.catId).rarity >= Rarity.Uber),
	};
}

type UberRoll = {
	index: number;
	cat: NonNullable<ReturnType<typeof lookupCat>>;
	event: CatDatabase["events"][string];
};
type UberOptions = Record<
	number,
	{
		trackA: UberRoll[];
		trackB: UberRoll[];
	}
>;

function App() {
	const [seed, setSeed] = useCatSeed();
	const catDatabase = useCatDatabase();
	const { openCatDialog, openBookmarkManager } = useDialogs();

	const [uberOptions, setUberOptions] = useState<
		{ index: number; trackA: UberRoll[]; trackB: UberRoll[] }[]
	>([]);

	useEffect(() => {
		if (!catDatabase.data) return;
		// Find relevant events
		const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
		const eventOptions = Object.entries(catDatabase.data?.events || {});
		const regularEvents = eventOptions
			.filter(([_code, ev]) => !!ev.guaranteed || !!ev.step_up)
			.map(([code, ev]) => ({ code, ...ev }))
			.filter((ev) => ev.end_on >= today);
		const rolls = regularEvents.map((event) => ({
			event,
			...extractUbers(
				catDatabase.data,
				rollTracks(createGachaEvent(event, catDatabase.data), seed, 100),
			),
		}));
		const ubersByIndexAndTrack = rolls.flatMap((roll) =>
			roll.trackA
				.map((r) => ({ index: r.index, track: "A", cat: r, event: roll.event }))
				.concat(
					roll.trackB.map((r) => ({
						index: r.index,
						track: "B",
						cat: r,
						event: roll.event,
					})),
				),
		);
		const uberRolls = ubersByIndexAndTrack.reduce((acc, curr) => {
			acc[curr.index] = acc[curr.index] || { trackA: [], trackB: [] };
			const cat = lookupCat(catDatabase.data, curr.cat.catId);
			if (!cat) return acc;
			const entry = {
				index: curr.cat.index,
				cat,
				event: curr.event,
			};
			if (curr.track === "A") acc[curr.index].trackA.push(entry);
			if (curr.track === "B") acc[curr.index].trackB.push(entry);
			return acc;
		}, {} as UberOptions);
		const uberOptions = Object.entries(uberRolls)
			.map(([index, rolls]) => ({
				index: +index,
				...rolls,
			}))
			.toSorted((a, b) => a.index - b.index);
		setUberOptions(uberOptions);
	}, [catDatabase.data, seed]);

	const seedInputId = useId();

	return (
		<div className="p-4 md:p-6 max-w-7xl mx-auto">
			<div className="flex items-center gap-3 mb-8">
				<div className="p-3 bg-gradient-to-br from-yellow-400 to-purple-500 rounded-2xl shadow-lg shadow-yellow-500/20">
					<Crown className="w-7 h-7 text-yellow-950" />
				</div>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
						Uber Planner
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						Find guaranteed Uber cats across events
					</p>
				</div>
			</div>

			{catDatabase.isLoading && (
				<div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-700">
					<div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
					Loading cat database...
				</div>
			)}

			<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
				<div className="max-w-md">
					<label
						htmlFor={seedInputId}
						className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
					>
						Your Seed
					</label>
					<div className="flex gap-2">
						<input
							type="text"
							id={seedInputId}
							name="seed-input"
							value={seed}
							onChange={(e) =>
								setSeed(+(e.target.value.match(/\d+/g)?.join("") ?? 0))
							}
							className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600"
							placeholder="Enter seed number"
						/>
						<button
							type="button"
							onClick={openBookmarkManager}
							className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
							title="Manage bookmarks"
						>
							<Bookmark className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>

			<div className="space-y-4">
				{catDatabase.data && uberOptions.length === 0 && (
					<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 p-8 text-center">
						<Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
						<p className="text-slate-500 dark:text-slate-400">
							No Uber cats found in the next 100 rolls for active events
						</p>
					</div>
				)}
				{catDatabase.data &&
					uberOptions.map((uberOption) => (
						<div
							key={uberOption.index}
							className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
						>
							<div className="px-5 py-3 bg-gradient-to-r from-purple-50 dark:from-purple-950 to-yellow-50 dark:to-fuchsia-950 border-b border-purple-100 dark:border-purple-900">
								<h2 className="font-bold text-lg text-purple-900 dark:text-purple-300 flex items-center gap-2">
									<span className="px-2.5 py-1 bg-purple-500 text-white text-sm font-bold rounded-lg">
										Roll {uberOption.index + 1}
									</span>
								</h2>
							</div>
							<div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700">
								<div className="p-4">
									<h3 className="font-bold text-sm text-blue-600 uppercase tracking-wider mb-3">
										Track A
									</h3>
									<div className="flex flex-col gap-2">
										{uberOption.trackA.length === 0 && (
											<div className="text-sm text-slate-400 dark:text-slate-500 py-2">
												No Uber cats in this track
											</div>
										)}
										{uberOption.trackA.map((cat) => (
											<button
												type="button"
												key={`${cat.cat.id}-${cat.event.start_on}`}
												className="p-3 bg-gradient-to-br from-purple-50 dark:from-purple-950 to-yellow-50 dark:to-fuchsia-950 border border-purple-200/50 dark:border-purple-900/50 rounded-xl cursor-pointer text-left"
												onClick={() => openCatDialog(cat.cat.id)}
											>
												<div className="flex items-center gap-2 flex-wrap mb-1">
													<span className="font-bold text-slate-800 dark:text-slate-100">
														{cat.cat.name}
													</span>
													<RarityTag rarity={cat.cat.rarity} />
													{getCatTierRank(cat.cat.id) && (
														<span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200">
															Tier {getCatTierRank(cat.cat.id)}
														</span>
													)}
												</div>
												<div className="text-sm text-slate-500 dark:text-slate-400">
													{cat.event.name}
												</div>
											</button>
										))}
									</div>
								</div>
								<div className="p-4">
									<h3 className="font-bold text-sm text-emerald-600 uppercase tracking-wider mb-3">
										Track B
									</h3>
									<div className="flex flex-col gap-2">
										{uberOption.trackB.length === 0 && (
											<div className="text-sm text-slate-400 dark:text-slate-500 py-2">
												No Uber cats in this track
											</div>
										)}
										{uberOption.trackB.map((cat) => (
											<button
												type="button"
												key={`${cat.cat.id}-${cat.event.start_on}`}
												className="p-3 bg-gradient-to-br from-purple-50 dark:from-purple-950 to-yellow-50 dark:to-fuchsia-950 border border-purple-200/50 dark:border-purple-900/50 rounded-xl cursor-pointer text-left"
												onClick={() => openCatDialog(cat.cat.id)}
											>
												<div className="flex items-center gap-2 flex-wrap mb-1">
													<span className="font-bold text-slate-800 dark:text-slate-100">
														{cat.cat.name}
													</span>
													<RarityTag rarity={cat.cat.rarity} />
													{getCatTierRank(cat.cat.id) && (
														<span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200">
															Tier {getCatTierRank(cat.cat.id)}
														</span>
													)}
												</div>
												<div className="text-sm text-slate-500 dark:text-slate-400">
													{cat.event.name}
													<span className="text-slate-400 dark:text-slate-500">
														{" "}
														· starts {cat.event.start_on}
													</span>
												</div>
											</button>
										))}
									</div>
								</div>
							</div>
						</div>
					))}
			</div>
		</div>
	);
}
