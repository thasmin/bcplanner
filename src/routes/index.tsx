import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { Cat } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Rarity, rollTracks } from "../data/battle-cats-gacha";
import {
	type CatInfo,
	createGachaEvent,
	getEventOptions,
	loadCatDatabase,
} from "../data/gacha-data";
import { tierList } from "../utils";

export const Route = createFileRoute("/")({ component: App });

function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}

function rarityName(rarity: number) {
	return (
		["Normal", "Special", "Rare", "Super Rare", "Uber", "Legend"][rarity] ||
		"Unknown"
	);
}

function getRarityBgClass(rarity?: number) {
	if (rarity === undefined) return "";
	if (rarity === Rarity.SuperRare) return "bg-blue-50";
	if (rarity === Rarity.Uber) return "bg-yellow-50";
	if (rarity === Rarity.Legend) return "bg-purple-50";
	return "";
}

function getRarityColors(rarity: number) {
	if (rarity === Rarity.SuperRare) return "bg-blue-100 text-blue-800";
	if (rarity === Rarity.Uber) return "bg-yellow-100 text-yellow-800";
	if (rarity === Rarity.Legend) return "bg-purple-100 text-purple-800";
	return "bg-gray-100 text-gray-800";
}

function getCatTierRank(catId: number): string | undefined {
	for (const tier of tierList) {
		if (tier.cats.includes(catId)) {
			return tier.rank;
		}
	}
	return undefined;
}

function App() {
	const [seed, setSeed] = useState(2428617162);
	const [selectedEvent, setSelectedEvent] = useState<string>("");

	const debouncedSeed = useDebounce(seed, 500);

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
			setSelectedEvent(eventOptions[0].key);
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
				cat: lookupCat(rollA.catId),
				guaranteedUberId: lookupCat(rollA.guaranteedUberId),
				switchedFromCatId: lookupCat(rollA.switchedFromCatId),
				nextAfterGuaranteed: rollA.nextAfterGuaranteed,
			},
			trackB: {
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
		setTracks(rollTracks(event, debouncedSeed, 100));
	}, [debouncedSeed, selectedEvent, catDatabaseQuery.data]);

	// Derive isStepUp from current event data
	const isStepUp =
		catDatabaseQuery.data && selectedEvent
			? !!catDatabaseQuery.data.events[selectedEvent]?.step_up
			: false;

	const seedInputId = useId();
	const eventInputId = useId();

	return (
		<div className="p-4 max-w-7xl mx-auto">
			<div className="flex items-center gap-2 mb-6">
				<Cat className="w-8 h-8" />
				<h1 className="text-2xl font-bold">Battle Cats Roll Planner</h1>
			</div>

			{catDatabaseQuery.isLoading && (
				<div className="text-gray-600">Loading cat database...</div>
			)}

			<div className="bg-white rounded-lg shadow p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label
							htmlFor={seedInputId}
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Seed:
						</label>
						<input
							type="text"
							id={seedInputId}
							name="seed-input"
							value={seed}
							onChange={(e) =>
								setSeed(+(e.target.value.match(/\d+/g)?.join("") ?? 0))
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Enter seed number"
						/>
					</div>

					<div>
						<label
							htmlFor={eventInputId}
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Event:
						</label>
						<select
							value={selectedEvent}
							id={eventInputId}
							name="event-select"
							onChange={(e) => setSelectedEvent(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">
						Next 100 Rolls (Track A and Track B)
					</h2>
					<p className="text-sm text-gray-600 mt-1">
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
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									#
								</th>
								<th
									colSpan={eventHasGuaranteedUber ? 3 : 2}
									className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-300 bg-blue-50"
								>
									Track A
								</th>
								<th
									colSpan={eventHasGuaranteedUber ? 3 : 2}
									className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-300 bg-green-50"
								>
									Track B
								</th>
							</tr>
							<tr>
								<th className="px-3 py-2"></th>
								<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-300">
									Cat
								</th>
								<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Rarity
								</th>
								{eventHasGuaranteedUber && (
									<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Guaranteed
									</th>
								)}
								<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-300">
									Cat
								</th>
								<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Rarity
								</th>
								{eventHasGuaranteedUber && (
									<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Guaranteed
									</th>
								)}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{trackRolls.map((tr, ndx) => {
								return (
									<tr key={trackRolls[ndx].index}>
										<td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
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
											<span
												className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
													tr.trackA.cat.rarity === Rarity.Uber
														? "bg-yellow-100 text-yellow-800"
														: tr.trackA.cat.rarity === Rarity.Legend
															? "bg-purple-100 text-purple-800"
															: tr.trackA.cat.rarity === Rarity.SuperRare
																? "bg-blue-100 text-blue-800"
																: "bg-gray-100 text-gray-800"
												}`}
											>
												{rarityName(tr.trackA.cat.rarity)}
											</span>
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
											<span
												className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRarityColors(
													tr.trackB.cat.rarity,
												)}`}
											>
												{rarityName(tr.trackB.cat.rarity)}
											</span>
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
