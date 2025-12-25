import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { Bookmark, Cat, Dices } from "lucide-react";
import { useEffect, useId, useState } from "react";
import RarityTag from "@/components/RarityTag";
import { useDialogs } from "@/contexts/DialogContext";
import { Rarity, rollTracks } from "../data/battle-cats-gacha";
import { createGachaEvent, getEventOptions } from "../data/gacha-data";
import {
	getRarityBgClass,
	getRarityColors,
	lookupCat,
	useCatDatabase,
	useCatSeed,
	useOwnedCats,
} from "../utils";

export const Route = createFileRoute("/")({
	component: App,
	validateSearch: (search) => {
		return { seed: typeof search.seed === "number" ? search.seed : undefined };
	},
});

interface CatColumnsData {
	score: number;
	nextSeed: number;
	cat: { id: number; name: string; rarity: Rarity };
	switchedFromCat?: { id: number; name: string; rarity: Rarity };
	guaranteedUber?: { id: number; name: string };
	nextAfterGuaranteed?: string;
}

const CatColumns: React.FC<{
	track: "A" | "B";
	rowNum: number;
	roll: CatColumnsData;
	onSelectCatId: (id: number) => void;
	onRoll: (nextSeed: number) => void;
}> = ({ track, rowNum, roll, onSelectCatId, onRoll }) => {
	const { ownedCats } = useOwnedCats();
	const isUberOrLegend =
		roll.cat.rarity === Rarity.Uber || roll.cat.rarity === Rarity.Legend;
	const isUnowned = !ownedCats.has(roll.cat.id);
	return (
		<>
			<td
				className={clsx(
					"px-2 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700",
					getRarityBgClass(roll.cat.rarity),
				)}
			>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => onSelectCatId(roll.cat.id)}
						className={clsx(
							"p-1 border rounded hover:bg-purple-100 dark:hover:bg-purple-900",
							isUberOrLegend &&
								isUnowned &&
								"font-bold border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950",
						)}
					>
						{roll.cat.name}
					</button>
				</div>
				{roll.switchedFromCat && (
					<div className="text-xs text-orange-600 dark:text-orange-400">
						Rerolled from {roll.switchedFromCat.name}
						<div>→ {track === "A" ? `${rowNum + 2}B` : `${rowNum + 3}A`}</div>
					</div>
				)}
			</td>
			<td
				className={clsx(
					"px-2 py-3 whitespace-nowrap text-sm",
					getRarityBgClass(roll.cat.rarity),
				)}
			>
				<RarityTag catId={roll.cat.id} rarity={roll.cat.rarity} />
				{roll.cat.rarity !== Rarity.Uber && roll.score > 9300 && (
					<span
						className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRarityColors(Rarity.Uber)}`}
					>
						FEST UBER
					</span>
				)}
			</td>
			{roll.guaranteedUber && (
				<td
					className={clsx(
						"px-2 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-gray-200",
						getRarityBgClass(Rarity.Uber),
						!ownedCats.has(roll.guaranteedUber.id) &&
							"ring-2 ring-inset ring-emerald-400 dark:ring-emerald-500",
					)}
				>
					<div
						className={clsx(
							"font-medium text-amber-700 dark:text-amber-300",
							!ownedCats.has(roll.guaranteedUber.id) && "font-bold",
						)}
					>
						{roll.guaranteedUber.name}
					</div>
					<div className="text-gray-500 dark:text-gray-400 mt-1">
						→ {roll.nextAfterGuaranteed}
					</div>
				</td>
			)}
			<td
				className={clsx(
					"px-2 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-gray-200",
					getRarityBgClass(roll.cat.rarity),
				)}
			>
				<button
					type="button"
					onClick={() => onRoll(roll.nextSeed)}
					className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg transition-all duration-200"
					title="Jump to this seed"
				>
					<Dices size={18} />
				</button>
			</td>
		</>
	);
};

function App() {
	const { seed: requestedSeed } = Route.useSearch();
	const [seed, setSeed] = useCatSeed(requestedSeed);
	const [selectedEvent, setSelectedEvent] = useState("");
	const { openCatDialog, openBookmarkManager } = useDialogs();

	const catDatabase = useCatDatabase();

	// Set default event when events load
	const eventOptions = catDatabase.data
		? getEventOptions(catDatabase.data.events)
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
	const trackRolls = catDatabase.data
		? tracks.trackA.map((rollA, index) => {
				const rollB = tracks.trackB[index];
				return {
					index,
					trackA: {
						score: rollA.score,
						nextSeed: rollA.nextSeed,
						cat: lookupCat(catDatabase.data, rollA.catId),
						guaranteedUber: lookupCat(catDatabase.data, rollA.guaranteedUberId),
						switchedFromCat: lookupCat(
							catDatabase.data,
							rollA.switchedFromCatId,
						),
						nextAfterGuaranteed: rollA.nextAfterGuaranteed,
					},
					trackB: {
						score: rollB.score,
						nextSeed: rollB.nextSeed,
						cat: lookupCat(catDatabase.data, rollB.catId),
						guaranteedUber: lookupCat(catDatabase.data, rollB.guaranteedUberId),
						switchedFromCat: lookupCat(
							catDatabase.data,
							rollB.switchedFromCatId,
						),
						nextAfterGuaranteed: rollB.nextAfterGuaranteed,
					},
				};
			})
		: [];

	const eventData = catDatabase.data?.events[selectedEvent];
	const eventHasGuaranteedUber = eventData?.step_up || eventData?.guaranteed;

	// Calculate rolls when seed or event changes
	useEffect(() => {
		if (!catDatabase.data || !selectedEvent) return;

		const eventData = catDatabase.data.events[selectedEvent];

		if (!eventData) {
			console.error(`Event ${selectedEvent} not found`);
			return;
		}

		const event = createGachaEvent(eventData, catDatabase.data);
		setTracks(rollTracks(event, seed, 100));
	}, [seed, selectedEvent, catDatabase.data]);

	// Derive isStepUp from current event data
	const isStepUp =
		catDatabase.data && selectedEvent
			? !!catDatabase.data.events[selectedEvent]?.step_up
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
					<h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
						Roll Planner
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						Plan your gacha rolls strategically
					</p>
				</div>
			</div>

			{catDatabase.isLoading && (
				<div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700">
					<div className="animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full" />
					Loading cat database...
				</div>
			)}

			<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
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

					<div>
						<label
							htmlFor={eventInputId}
							className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
						>
							Gacha Event
						</label>
						<select
							value={selectedEvent}
							id={eventInputId}
							name="event-select"
							onChange={(e) => setSelectedEvent(e.target.value)}
							className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
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

			<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
				<div className="px-6 py-5 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-slate-100/50 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
					<h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
						Next 100 Rolls
					</h2>
					<p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
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
						)}{" "}
						Cats with a{" "}
						<span className="ring-2 ring-inset ring-emerald-400 dark:ring-emerald-500 p-1 rounded">
							green outline
						</span>{" "}
						are Uber or Legend rarity cats that are not in your collection.
					</p>
					<div className="mt-3 flex flex-wrap gap-3 text-xs">
						<div className="flex items-center gap-2">
							<span className="font-semibold text-slate-600 dark:text-slate-300">
								Legend:
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded font-bold border border-green-300 dark:border-green-700">
								R
							</span>
							<span className="text-slate-600 dark:text-slate-400">Rare</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded font-bold border border-blue-300 dark:border-blue-700">
								SR
							</span>
							<span className="text-slate-600 dark:text-slate-400">
								Super Rare
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded font-bold border border-amber-300 dark:border-amber-700">
								U
							</span>
							<span className="text-slate-600 dark:text-slate-400">
								Uber Rare
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded font-bold border border-purple-300 dark:border-purple-700">
								L
							</span>
							<span className="text-slate-600 dark:text-slate-400">Legend</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="text-slate-500 dark:text-slate-400">•</span>
							<span className="text-slate-600 dark:text-slate-400">
								Tier ratings (e.g., U-B+) show cat strength
							</span>
						</div>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full">
						<thead>
							<tr className="bg-slate-50/80 dark:bg-slate-800/80">
								<th className="px-3 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
									#
								</th>
								<th
									colSpan={eventHasGuaranteedUber ? 4 : 3}
									className="px-3 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/50"
								>
									Track A
								</th>
								<th
									colSpan={eventHasGuaranteedUber ? 4 : 3}
									className="px-3 py-3 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/50"
								>
									Track B
								</th>
							</tr>
							<tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
								<th className="px-3 py-2"></th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700">
									Cat
								</th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
									Rarity
								</th>
								{eventHasGuaranteedUber && (
									<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
										Guaranteed
									</th>
								)}
								<th></th>

								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700">
									Cat
								</th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
									Rarity
								</th>
								{eventHasGuaranteedUber && (
									<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
										Guaranteed
									</th>
								)}
								<th></th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-slate-700">
							{trackRolls.map((tr, ndx) => {
								return (
									<tr
										key={tr.index}
										className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
									>
										<td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-slate-400 dark:text-slate-500">
											{ndx + 1}
										</td>
										<CatColumns
											track="A"
											rowNum={ndx}
											roll={tr.trackA}
											onSelectCatId={openCatDialog}
											onRoll={setSeed}
										/>
										<CatColumns
											track="B"
											rowNum={ndx}
											roll={tr.trackB}
											onSelectCatId={openCatDialog}
											onRoll={setSeed}
										/>
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
