import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { Cat, Dices } from "lucide-react";
import { useEffect, useId, useState } from "react";
import RarityTag from "@/components/RarityTag";
import { Rarity, rollTracks } from "../data/battle-cats-gacha";
import {
	type CatInfo,
	createGachaEvent,
	getEventOptions,
	loadCatDatabase,
} from "../data/gacha-data";
import { getCatTierRank, getRarityBgClass, getRarityColors } from "../utils";

export const Route = createFileRoute("/")({ component: App });

const useCatSeed = () => {
	const defaultSeedStr = localStorage.getItem("catSeed");
	const defaultSeed = defaultSeedStr ? +defaultSeedStr : 4255329801;
	const [seed, setSeed] = useState(defaultSeed);
	const updateSeed = (newSeed: number) => {
		setSeed(newSeed);
		localStorage.setItem("catSeed", newSeed.toString());
	};
	return [seed, updateSeed] as const;
};

function App() {
	const [seed, setSeed] = useCatSeed();
	const [selectedEvent, setSelectedEvent] = useState("");

	// Load cat database
	const catDatabaseQuery = useQuery({
		queryKey: ["catDatabase"],
		queryFn: loadCatDatabase,
		staleTime: Infinity, // Never refetch
	});

	interface CatRowData {
		id: number;
		rarity: number;
		name: string;
	}

	function lookupCat(catId: number): CatRowData;
	function lookupCat(catId: number | undefined): CatRowData | undefined;
	function lookupCat(catId: number | undefined): CatRowData | undefined {
		if (!catId) return undefined;
		const cat =
			catDatabaseQuery.data?.cats[catId] ||
			({
				id: catId,
				name: ["Unknown"],
				desc: [],
				rarity: 0,
				max_level: 0,
			} as CatInfo);
		return {
			id: catId,
			rarity: cat.rarity,
			name: cat.name[0],
		};
	}

	// Set default event when events load
	const eventOptions = catDatabaseQuery.data
		? getEventOptions(catDatabaseQuery.data.events)
		: [];

	useEffect(() => {
		if (eventOptions.length > 0 && !selectedEvent) {
			setSelectedEvent(
				eventOptions.find((ev) => !ev.platinum)?.key ?? eventOptions[0].key,
			);
		}
	}, [eventOptions, selectedEvent]);

	const [tracks, setTracks] = useState<ReturnType<typeof rollTracks>>({
		trackA: [],
		trackB: [],
	});
	const trackRolls = tracks.trackA.map((rollA, index) => {
		const rollB = tracks.trackB[index];
		return {
			index,
			trackA: {
				score: rollA.score,
				nextSeed: rollA.nextSeed,
				cat: lookupCat(rollA.catId),
				guaranteedUberId: lookupCat(rollA.guaranteedUberId),
				switchedFromCatId: lookupCat(rollA.switchedFromCatId),
				nextAfterGuaranteed: rollA.nextAfterGuaranteed,
			},
			trackB: {
				score: rollB.score,
				nextSeed: rollB.nextSeed,
				cat: lookupCat(rollB.catId),
				guaranteedUber: lookupCat(rollB.guaranteedUberId),
				switchedFromCat: lookupCat(rollB.switchedFromCatId),
				nextAfterGuaranteed: rollB.nextAfterGuaranteed,
			},
		};
	});

	const eventData = catDatabaseQuery.data?.events[selectedEvent];
	const eventHasGuaranteedUber = eventData?.step_up || eventData?.guaranteed;

	// Calculate rolls when seed or event changes
	useEffect(() => {
		if (!catDatabaseQuery.data || !selectedEvent) return;

		const catDatabase = catDatabaseQuery.data;
		const eventData = catDatabase.events[selectedEvent];

		if (!eventData) {
			console.error(`Event ${selectedEvent} not found`);
			return;
		}

		const event = createGachaEvent(eventData, catDatabase);
		setTracks(rollTracks(event, seed, 100));
	}, [seed, selectedEvent, catDatabaseQuery.data]);

	// Derive isStepUp from current event data
	const isStepUp =
		catDatabaseQuery.data && selectedEvent
			? !!catDatabaseQuery.data.events[selectedEvent]?.step_up
			: false;

	const seedInputId = useId();
	const eventInputId = useId();

	return (
		<div className="p-4 md:p-6 max-w-7xl mx-auto">
			<div className="flex items-center gap-3 mb-8">
				<div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/20">
					<Cat className="w-7 h-7 text-indigo-950" />
				</div>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-slate-800">Roll Planner</h1>
					<p className="text-sm text-slate-500">Plan your gacha rolls strategically</p>
				</div>
			</div>

			{catDatabaseQuery.isLoading && (
				<div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
					<div className="animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full" />
					Loading cat database...
				</div>
			)}

			<div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label
							htmlFor={seedInputId}
							className="block text-sm font-semibold text-slate-700 mb-2"
						>
							Your Seed
						</label>
						<input
							type="text"
							id={seedInputId}
							name="seed-input"
							value={seed}
							onChange={(e) =>
								setSeed(+(e.target.value.match(/\d+/g)?.join("") ?? 0))
							}
							className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300"
							placeholder="Enter seed number"
						/>
					</div>

					<div>
						<label
							htmlFor={eventInputId}
							className="block text-sm font-semibold text-slate-700 mb-2"
						>
							Gacha Event
						</label>
						<select
							value={selectedEvent}
							id={eventInputId}
							name="event-select"
							onChange={(e) => setSelectedEvent(e.target.value)}
							className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 transition-all duration-200 hover:border-slate-300 cursor-pointer"
							disabled={eventOptions.length === 0}
						>
							{eventOptions.map((event) => (
								<option key={event.key} value={event.key}>
									{event.displayName}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			<div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 overflow-hidden">
				<div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
					<h2 className="text-lg font-bold text-slate-800">
						Next 100 Rolls
					</h2>
					<p className="text-sm text-slate-500 mt-1 leading-relaxed">
						{eventHasGuaranteedUber ? (
							<>
								Guaranteed Uber rolls available. Using a guaranteed roll
								advances you {isStepUp ? "15" : "10"} rolls and switches to the
								opposite track. If the last roll before the guaranteed has a
								duplicate (reroll), the track switches twice and returns to the
								original track.
							</>
						) : (
							"Track A and Track B show alternate timelines. Duplicate cats are automatically rerolled and switch tracks."
						)}
					</p>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full">
						<thead>
							<tr className="bg-slate-50/80">
								<th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
									#
								</th>
								<th
									colSpan={eventHasGuaranteedUber ? 4 : 3}
									className="px-3 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider border-l border-slate-200 bg-blue-50/50"
								>
									Track A
								</th>
								<th
									colSpan={eventHasGuaranteedUber ? 4 : 3}
									className="px-3 py-3 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider border-l border-slate-200 bg-emerald-50/50"
								>
									Track B
								</th>
							</tr>
							<tr className="bg-slate-50/50 border-b border-slate-200">
								<th className="px-3 py-2"></th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-l border-slate-200">
									Cat
								</th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Rarity
								</th>
								{eventHasGuaranteedUber && (
									<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
										Guaranteed
									</th>
								)}
								<th></th>

								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-l border-slate-200">
									Cat
								</th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
									Rarity
								</th>
								{eventHasGuaranteedUber && (
									<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
										Guaranteed
									</th>
								)}
								<th></th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{trackRolls.map((tr, ndx) => {
								return (
									<tr key={trackRolls[ndx].index} className="hover:bg-slate-50/50 transition-colors">
										<td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-slate-400">
											{ndx + 1}
										</td>
										<td
											className={clsx(
												"px-2 py-3 whitespace-nowrap text-sm text-gray-900 border-l border-gray-200",
												getRarityBgClass(tr.trackA.cat.rarity),
											)}
										>
											<div className="flex items-center gap-2">
												<span>{tr.trackA.cat.name}</span>
												{getCatTierRank(tr.trackA.cat.id) && (
													<span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
														{getCatTierRank(tr.trackA.cat.id)}
													</span>
												)}
											</div>
											{tr.trackA.switchedFromCatId && (
												<div className="text-xs text-orange-600">
													Rerolled from {tr.trackA.switchedFromCatId.name}
													<div>→ {ndx + 2}B</div>
												</div>
											)}
										</td>
										<td
											className={clsx(
												"px-2 py-3 whitespace-nowrap text-sm",
												getRarityBgClass(tr.trackA.cat.rarity),
											)}
										>
											<RarityTag rarity={tr.trackA.cat.rarity} />
											{tr.trackA.score > 9300 && (
												<span
													className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRarityColors(Rarity.Uber)}`}
												>
													FEST UBER
												</span>
											)}
										</td>
										{eventHasGuaranteedUber && (
											<td
												className={clsx(
													"px-2 py-3 whitespace-nowrap text-xs text-gray-700",
													getRarityBgClass(Rarity.Uber),
												)}
											>
												{tr.trackA.guaranteedUberId && (
													<>
														<div className="font-medium text-amber-700">
															{tr.trackA.guaranteedUberId.name}
														</div>
														<div className="text-gray-500 mt-1">
															→ {tr.trackA.nextAfterGuaranteed}
														</div>
													</>
												)}
											</td>
										)}
										<td
											className={clsx(
												"px-2 py-3 whitespace-nowrap text-xs text-gray-700",
												getRarityBgClass(tr.trackA.cat.rarity),
											)}
										>
											<button
												type="button"
												onClick={() => setSeed(tr.trackA.nextSeed)}
												className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
												title="Jump to this seed"
											>
												<Dices size={18} />
											</button>
										</td>

										<td
											className={clsx(
												"px-2 py-3 whitespace-nowrap text-sm text-gray-900 border-l border-gray-300",
												getRarityBgClass(tr.trackB.cat.rarity),
											)}
										>
											<div className="flex items-center gap-2">
												<span>{tr.trackB.cat.name}</span>
												{getCatTierRank(tr.trackB.cat.id) && (
													<span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
														{getCatTierRank(tr.trackB.cat.id)}
													</span>
												)}
											</div>
											{tr.trackB.switchedFromCat && (
												<div className="text-xs text-orange-600">
													Rerolled from {tr.trackB.switchedFromCat.name}
													<div>→ {tr.index + 2}A</div>
												</div>
											)}
										</td>
										<td
											className={clsx(
												"px-2 py-3 whitespace-nowrap text-sm",
												getRarityBgClass(tr.trackB.cat.rarity),
											)}
										>
											<RarityTag rarity={tr.trackB.cat.rarity} />
											{tr.trackB.score > 9300 && (
												<span
													className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRarityColors(Rarity.Uber)}`}
												>
													FEST UBER
												</span>
											)}
										</td>
										{eventHasGuaranteedUber && (
											<td
												className={clsx(
													"px-2 py-3 whitespace-nowrap text-xs text-gray-700",
													getRarityBgClass(Rarity.Uber),
												)}
											>
												{tr.trackB.guaranteedUber && (
													<>
														<div className="font-medium text-amber-700">
															{tr.trackB.guaranteedUber.name} (
															{tr.trackB.guaranteedUber.id})
														</div>
														<div className="text-gray-500 mt-1">
															→ {tr.trackB.nextAfterGuaranteed}
														</div>
													</>
												)}
											</td>
										)}
										<td
											className={clsx(
												"px-2 py-3 whitespace-nowrap text-xs text-gray-700",
												getRarityBgClass(tr.trackB.cat.rarity),
											)}
										>
											<button
												type="button"
												onClick={() => setSeed(tr.trackB.nextSeed)}
												className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
												title="Jump to this seed"
											>
												<Dices size={18} />
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
