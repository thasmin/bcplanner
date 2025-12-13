import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Cat } from "lucide-react";
import { useEffect, useId, useState } from "react";
import RarityTag from "@/components/RarityTag";
import { Rarity, rollTracks } from "../data/battle-cats-gacha";
import {
	type CatDatabase,
	createGachaEvent,
	loadCatDatabase,
} from "../data/gacha-data";
import { getCatTierRank, lookupCat } from "../utils";

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
	const [seed, setSeed] = useState(4255329801);

	// Load cat database
	const catDatabaseQuery = useQuery({
		queryKey: ["catDatabase"],
		queryFn: loadCatDatabase,
		staleTime: Infinity, // Never refetch
	});

	const [uberOptions, setUberOptions] = useState<
		{ index: number; trackA: UberRoll[]; trackB: UberRoll[] }[]
	>([]);

	useEffect(() => {
		if (!catDatabaseQuery.data) return;
		// Find relevant events
		const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
		const eventOptions = Object.entries(catDatabaseQuery.data?.events || {});
		const regularEvents = eventOptions
			.filter(([_code, ev]) => !!ev.guaranteed || !!ev.step_up)
			.map(([code, ev]) => ({ code, ...ev }))
			.filter((ev) => ev.end_on >= today);
		const rolls = regularEvents.map((event) => ({
			event,
			...extractUbers(
				catDatabaseQuery.data,
				rollTracks(createGachaEvent(event, catDatabaseQuery.data), seed, 100),
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
			const cat = lookupCat(catDatabaseQuery.data, curr.cat.catId);
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
	}, [catDatabaseQuery.data, seed]);

	const seedInputId = useId();

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
				</div>
			</div>

			<div className="bg-white rounded-lg shadow overflow-hidden">
				{catDatabaseQuery.data && (
					<div className="overflow-x-auto">
						{uberOptions.map((uberOptions) => (
							<div
								key={uberOptions.index}
								className="p-2 border-b border-gray-200"
							>
								<h2 className="font-bold text-lg"> Row {uberOptions.index}</h2>
								<div className="flex gap-4">
									<div className="flex-1">
										<h3 className="font-semibold">Track A</h3>
										<div className="flex gap-2 flex-col">
											{uberOptions.trackA.length === 0 && (
												<div className="text-sm text-gray-500 pt-2">
													No cats in this track
												</div>
											)}
											{uberOptions.trackA.map((cat) => (
												<div
													key={`${cat.cat.id}-${cat.event.start_on}`}
													className="p-1 border rounded"
												>
													<div>
														{cat.cat.name}
														<RarityTag rarity={cat.cat.rarity} />
														{getCatTierRank(cat.cat.id) && (
															<span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
																Tier {getCatTierRank(cat.cat.id)}
															</span>
														)}
													</div>
													<div className="text-sm">from {cat.event.name}</div>
												</div>
											))}
										</div>
									</div>
									<div className="flex-1">
										<h3 className="font-semibold">Track B</h3>
										<div className="flex gap-2 flex-col">
											{uberOptions.trackB.map((cat) => (
												<div
													key={`${cat.cat.id}-${cat.event.start_on}`}
													className="p-1 border rounded"
												>
													<div className="flex gap-4 items-center">
														{cat.cat.name}
														<RarityTag rarity={cat.cat.rarity} />
														{getCatTierRank(cat.cat.id) && (
															<span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
																Tier {getCatTierRank(cat.cat.id)}
															</span>
														)}
													</div>
													<div className="text-sm">
														from {cat.event.name} starting on{" "}
														{cat.event.start_on}
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
