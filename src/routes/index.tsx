import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Cat } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { type RollResult, rollMultiple } from "../data/battle-cats-gacha";
import {
	createGachaEvent,
	getEventOptions,
	loadCatDatabase,
	loadGachaEvents,
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

function App() {
	const [seed, setSeed] = useState(2428617162);
	const [selectedEvent, setSelectedEvent] = useState<string>("");
	const [rolls, setRolls] = useState<RollResult[]>([]);

	const debouncedSeed = useDebounce(seed, 500);

	// Load cat database
	const catDatabaseQuery = useQuery({
		queryKey: ["catDatabase"],
		queryFn: loadCatDatabase,
		staleTime: Infinity, // Never refetch
	});

	// Load gacha events
	const gachaEventsQuery = useQuery({
		queryKey: ["gachaEvents"],
		queryFn: loadGachaEvents,
		staleTime: Infinity, // Never refetch
	});

	// Set default event when events load
	const eventOptions = gachaEventsQuery.data
		? getEventOptions(gachaEventsQuery.data)
		: [];

	useEffect(() => {
		if (eventOptions.length > 0 && !selectedEvent) {
			setSelectedEvent(eventOptions[0].key);
		}
	}, [eventOptions, selectedEvent]);

	// Calculate rolls when seed or event changes
	useEffect(() => {
		if (!catDatabaseQuery.data || !gachaEventsQuery.data || !selectedEvent)
			return;

		const catDatabase = catDatabaseQuery.data;
		const gachaEvents = gachaEventsQuery.data;
		const eventData = gachaEvents[selectedEvent];

		if (!eventData) {
			console.error(`Event ${selectedEvent} not found`);
			return;
		}

		const event = createGachaEvent(eventData, catDatabase);

		const results = rollMultiple(debouncedSeed, event, 100);

		// Add cat names to results
		const resultsWithNames = results.map((roll) => ({
			...roll,
			catName: catDatabase.cats[roll.catId]?.name?.[0] || "Unknown",
		}));

		setRolls(resultsWithNames);
	}, [
		debouncedSeed,
		selectedEvent,
		catDatabaseQuery.data,
		gachaEventsQuery.data,
	]);

	const isLoading = catDatabaseQuery.isLoading || gachaEventsQuery.isLoading;

	const seedInputId = useId();
	const eventInputId = useId();

	return (
		<div className="p-4 max-w-7xl mx-auto">
			<div className="flex items-center gap-2 mb-6">
				<Cat className="w-8 h-8" />
				<h1 className="text-2xl font-bold">Battle Cats Roll Planner</h1>
			</div>

			{isLoading && (
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
						Next 100 Rolls
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									#
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Cat Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Rarity
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Cat ID
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Score
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{rolls.map((roll) => (
								<tr
									key={roll.rollNumber}
									className={
										roll.rarityName === "Uber" || roll.rarityName === "Legend"
											? "bg-yellow-50"
											: ""
									}
								>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{roll.rollNumber}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{(roll as RollResult & { catName?: string }).catName}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
												roll.rarityName === "Uber"
													? "bg-yellow-100 text-yellow-800"
													: roll.rarityName === "Legend"
														? "bg-purple-100 text-purple-800"
														: roll.rarityName === "Super Rare"
															? "bg-blue-100 text-blue-800"
															: "bg-gray-100 text-gray-800"
											}`}
										>
											{roll.rarityName}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{roll.catId}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{roll.score}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{rolls.length > 0 && (
				<div className="mt-6 bg-white rounded-lg shadow p-6">
					<h3 className="text-lg font-semibold mb-4">Statistics</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{["Rare", "Super Rare", "Uber", "Legend"].map((rarity) => {
							const count = rolls.filter((r) => r.rarityName === rarity).length;
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
				</div>
			)}
		</div>
	);
}
