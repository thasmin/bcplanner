import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { Cat } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
	type BothTracksRoll,
	type RollResult,
	rollMultipleBothTracks,
} from "../data/battle-cats-gacha";
import {
	createGachaEvent,
	getEventOptions,
	loadCatDatabase,
} from "../data/gacha-data";

export const Route = createFileRoute("/")({ component: App });

function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}

function getRarityBgClass(rarityName?: string) {
	if (!rarityName) return "";
	if (rarityName === "Uber") return "bg-yellow-50";
	if (rarityName === "Legend") return "bg-purple-50";
	if (rarityName === "Super Rare") return "bg-blue-50";
	return "";
}

function getRarityColors(rarityName: string) {
	if (rarityName === "Uber") return "bg-yellow-100 text-yellow-800";
	if (rarityName === "Legend") return "bg-purple-100 text-purple-800";
	if (rarityName === "Super Rare") return "bg-blue-100 text-blue-800";
	return "bg-gray-100 text-gray-800";
}

type RollWithName = RollResult & {
	catName?: string;
	switchedFromCatName?: string;
};
type BothTracksRollWithNames = Omit<
	BothTracksRoll,
	"trackA" | "trackB" | "guaranteedA" | "guaranteedB"
> & {
	trackA: RollWithName;
	trackB: RollWithName;
	guaranteedA?: RollWithName;
	guaranteedB?: RollWithName;
};

function App() {
	const [seed, setSeed] = useState(2428617162);
	const [selectedEvent, setSelectedEvent] = useState<string>("");
	const [rolls, setRolls] = useState<BothTracksRollWithNames[]>([]);

	const debouncedSeed = useDebounce(seed, 500);

	// Load cat database
	const catDatabaseQuery = useQuery({
		queryKey: ["catDatabase"],
		queryFn: loadCatDatabase,
		staleTime: Infinity, // Never refetch
	});

	// Set default event when events load
	const eventOptions = catDatabaseQuery.data
		? getEventOptions(catDatabaseQuery.data.events)
		: [];

	useEffect(() => {
		if (eventOptions.length > 0 && !selectedEvent) {
			setSelectedEvent(eventOptions[0].key);
		}
	}, [eventOptions, selectedEvent]);

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
		const hasGuaranteed = eventData.guaranteed === true || !!eventData.step_up;
		const stepUpValue = !!eventData.step_up;

		const results = rollMultipleBothTracks(
			debouncedSeed,
			event,
			100,
			hasGuaranteed,
			stepUpValue,
		);

		// Add cat names to results for both tracks
		const resultsWithNames: BothTracksRollWithNames[] = results.map((roll) => {
			const result: BothTracksRollWithNames = {
				trackA: {
					...roll.trackA,
					catName: catDatabase.cats[roll.trackA.catId]?.name?.[0] || "Unknown",
					switchedFromCatName: roll.trackA.switchTracks
						? catDatabase.cats[roll.trackA.switchedFromCatId ?? -1]
								?.name?.[0] || "Unknown"
						: undefined,
				},
				trackB: {
					...roll.trackB,
					catName: catDatabase.cats[roll.trackB.catId]?.name?.[0] || "Unknown",
					switchedFromCatName: roll.trackB.switchTracks
						? catDatabase.cats[roll.trackB.switchedFromCatId ?? -1]
								?.name?.[0] || "Unknown"
						: undefined,
				},
			};

			if (roll.guaranteedA) {
				result.guaranteedA = {
					...roll.guaranteedA,
					catName:
						catDatabase.cats[roll.guaranteedA.catId]?.name?.[0] || "Unknown",
				};
				result.nextAfterGuaranteedA = roll.nextAfterGuaranteedA;
			}

			if (roll.guaranteedB) {
				result.guaranteedB = {
					...roll.guaranteedB,
					catName:
						catDatabase.cats[roll.guaranteedB.catId]?.name?.[0] || "Unknown",
				};
				result.nextAfterGuaranteedB = roll.nextAfterGuaranteedB;
			}

			return result;
		});

		setRolls(resultsWithNames);
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
						{rolls.some((r) => r.guaranteedA) ? (
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
									colSpan={rolls.some((r) => r.guaranteedA) ? 3 : 2}
									className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-300 bg-blue-50"
								>
									Track A
								</th>
								<th
									colSpan={rolls.some((r) => r.guaranteedB) ? 3 : 2}
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
								{rolls.some((r) => r.guaranteedA) && (
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
								{rolls.some((r) => r.guaranteedB) && (
									<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Guaranteed
									</th>
								)}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{rolls.map((roll) => {
								return (
									<tr key={roll.trackA.rollNumber}>
										<td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
											{roll.trackA.rollNumber}
										</td>
										<td
											className={clsx(
												"px-2 py-3 whitespace-nowrap text-sm text-gray-900 border-l border-gray-200",
												getRarityBgClass(roll.trackA.rarityName),
											)}
										>
											<div>{roll.trackA.catName}</div>
											{roll.trackA.switchTracks && (
												<div className="text-xs text-orange-600">
													⚠️ Rerolled from {roll.trackA.switchedFromCatName}
													<div>→ {roll.trackA.rollNumber + 1}B</div>
												</div>
											)}
										</td>
										<td
											className={clsx(
												"px-2 py-3 whitespace-nowrap text-sm",
												getRarityBgClass(roll.trackA.rarityName),
											)}
										>
											<span
												className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
													roll.trackA.rarityName === "Uber"
														? "bg-yellow-100 text-yellow-800"
														: roll.trackA.rarityName === "Legend"
															? "bg-purple-100 text-purple-800"
															: roll.trackA.rarityName === "Super Rare"
																? "bg-blue-100 text-blue-800"
																: "bg-gray-100 text-gray-800"
												}`}
											>
												{roll.trackA.rarityName}
											</span>
										</td>
										{rolls.some((r) => r.guaranteedA) && (
											<td
												className={clsx(
													"px-2 py-3 whitespace-nowrap text-xs text-gray-700",
													getRarityBgClass("Uber"),
												)}
											>
												{roll.guaranteedA && (
													<>
														<div className="font-medium text-amber-700">
															{roll.guaranteedA?.catName}
														</div>
														<div className="text-gray-500 mt-1">
															→ {roll.nextAfterGuaranteedA}
														</div>
													</>
												)}
											</td>
										)}

										<td
											className={clsx(
												"px-2 py-3 whitespace-nowrap text-sm text-gray-900 border-l border-gray-300",
												getRarityBgClass(roll.trackB.rarityName),
											)}
										>
											<div>{roll.trackB.catName}</div>
											{roll.trackB.switchTracks && (
												<div className="text-xs text-orange-600">
													⚠️ Rerolled from {roll.trackB.switchedFromCatName}
													<div>→ {roll.trackB.rollNumber + 1}A</div>
												</div>
											)}
										</td>
										<td
											className={clsx(
												"px-2 py-3 whitespace-nowrap text-sm",
												getRarityBgClass(roll.trackB.rarityName),
											)}
										>
											<span
												className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRarityColors(
													roll.trackB.rarityName,
												)}`}
											>
												{roll.trackB.rarityName}
											</span>
										</td>
										{rolls.some((r) => r.guaranteedB) && (
											<td
												className={clsx(
													"px-2 py-3 whitespace-nowrap text-xs text-gray-700",
													getRarityBgClass("Uber"),
												)}
											>
												{roll.guaranteedB && (
													<>
														<div className="font-medium text-amber-700">
															{roll.guaranteedB.catName}
														</div>
														<div className="text-gray-500 mt-1">
															→ {roll.nextAfterGuaranteedB}
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
