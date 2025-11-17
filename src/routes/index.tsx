import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Cat } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
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

type RollWithName = RollResult & { catName?: string };
type BothTracksRollWithNames = {
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
				},
				trackB: {
					...roll.trackB,
					catName: catDatabase.cats[roll.trackB.catId]?.name?.[0] || "Unknown",
				},
			};

			if (roll.guaranteedA) {
				result.guaranteedA = {
					...roll.guaranteedA,
					catName:
						catDatabase.cats[roll.guaranteedA.catId]?.name?.[0] || "Unknown",
				};
			}

			if (roll.guaranteedB) {
				result.guaranteedB = {
					...roll.guaranteedB,
					catName:
						catDatabase.cats[roll.guaranteedB.catId]?.name?.[0] || "Unknown",
				};
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
								Guaranteed Uber rolls available. Using a guaranteed roll advances
								you {isStepUp ? "14" : "10"} rolls and switches to the opposite
								track.
							</>
						) : (
							<>
								Track A and Track B show alternate timelines. Use a guaranteed
								roll (when available) to switch between tracks.
							</>
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
									className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-r border-gray-300 bg-blue-50"
								>
									Track A
								</th>
								<th
									colSpan={rolls.some((r) => r.guaranteedB) ? 3 : 2}
									className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 bg-green-50"
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
									<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
										Guaranteed
									</th>
								)}
								<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Cat
								</th>
								<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Rarity
								</th>
								{rolls.some((r) => r.guaranteedB) && (
									<th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
										Guaranteed
									</th>
								)}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{rolls.map((roll) => {
								const guaranteedRolls = isStepUp ? 15 : 10;
								const lastRollNumber = roll.trackA.rollNumber + guaranteedRolls - 1;

								// Based on Ruby: next_index = last.sequence - (last.track ^ 1)
								// For track A (0): next = last - 1, switch to B
								// For track B (1): next = last - 0, switch to A
								const nextFromA = lastRollNumber - 1;
								const nextFromB = lastRollNumber;

								return (
									<tr key={roll.trackA.rollNumber}>
										<td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
											{roll.trackA.rollNumber}
										</td>
										<td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 border-l border-gray-200">
											{roll.trackA.catName}
										</td>
										<td className="px-2 py-3 whitespace-nowrap text-sm">
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
										{roll.guaranteedA && (
											<td className="px-2 py-3 whitespace-nowrap text-xs text-gray-700 border-r border-gray-200">
												<div className="font-medium text-amber-700">
													{roll.guaranteedA.catName}
												</div>
												<div className="text-gray-500 mt-1">
													→ {nextFromA}B
												</div>
											</td>
										)}
										<td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
											{roll.trackB.catName}
										</td>
										<td className="px-2 py-3 whitespace-nowrap text-sm">
											<span
												className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
													roll.trackB.rarityName === "Uber"
														? "bg-yellow-100 text-yellow-800"
														: roll.trackB.rarityName === "Legend"
															? "bg-purple-100 text-purple-800"
															: roll.trackB.rarityName === "Super Rare"
																? "bg-blue-100 text-blue-800"
																: "bg-gray-100 text-gray-800"
												}`}
											>
												{roll.trackB.rarityName}
											</span>
										</td>
										{roll.guaranteedB && (
											<td className="px-2 py-3 whitespace-nowrap text-xs text-gray-700 border-r border-gray-200">
												<div className="font-medium text-amber-700">
													{roll.guaranteedB.catName}
												</div>
												<div className="text-gray-500 mt-1">
													→ {nextFromB}A
												</div>
											</td>
										)}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{rolls.length > 0 && (
				<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="bg-white rounded-lg shadow p-6">
						<h3 className="text-lg font-semibold mb-4">Track A Statistics</h3>
						<div className="grid grid-cols-2 gap-4">
							{["Rare", "Super Rare", "Uber", "Legend"].map((rarity) => {
								const count = rolls.filter(
									(roll) => roll.trackA.rarityName === rarity,
								).length;
								const percentage = ((count / rolls.length) * 100).toFixed(1);
								return (
									<div key={rarity} className="text-center">
										<div className="text-2xl font-bold text-gray-900">
											{count}
										</div>
										<div className="text-sm text-gray-600">
											{rarity} ({percentage}%)
										</div>
									</div>
								);
							})}
						</div>
						{rolls.some((r) => r.guaranteedA) && (
							<div className="mt-4 pt-4 border-t border-gray-200">
								<div className="text-center">
									<div className="text-xl font-bold text-amber-600">
										{rolls.filter((r) => r.guaranteedA).length}
									</div>
									<div className="text-sm text-gray-600">Guaranteed Ubers</div>
								</div>
							</div>
						)}
					</div>
					<div className="bg-white rounded-lg shadow p-6">
						<h3 className="text-lg font-semibold mb-4">Track B Statistics</h3>
						<div className="grid grid-cols-2 gap-4">
							{["Rare", "Super Rare", "Uber", "Legend"].map((rarity) => {
								const count = rolls.filter(
									(roll) => roll.trackB.rarityName === rarity,
								).length;
								const percentage = ((count / rolls.length) * 100).toFixed(1);
								return (
									<div key={rarity} className="text-center">
										<div className="text-2xl font-bold text-gray-900">
											{count}
										</div>
										<div className="text-sm text-gray-600">
											{rarity} ({percentage}%)
										</div>
									</div>
								);
							})}
						</div>
						{rolls.some((r) => r.guaranteedB) && (
							<div className="mt-4 pt-4 border-t border-gray-200">
								<div className="text-center">
									<div className="text-xl font-bold text-amber-600">
										{rolls.filter((r) => r.guaranteedB).length}
									</div>
									<div className="text-sm text-gray-600">Guaranteed Ubers</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
