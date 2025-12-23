import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, Cat } from "lucide-react";
import { useId, useState } from "react";
import EventDetailsDialog from "@/components/EventDetailsDialog";
import RarityTag from "@/components/RarityTag";
import { useDialogs } from "@/contexts/DialogContext";
import { rollTracks } from "../data/battle-cats-gacha";
import {
	type CatInfo,
	createGachaEvent,
	getEventOptions,
} from "../data/gacha-data";
import { getCatTierRank, useCatDatabase, useCatSeed } from "../utils";

export const Route = createFileRoute("/uber-planner")({
	component: App,
	validateSearch: (search) => {
		return { seed: typeof search.seed === "number" ? search.seed : undefined };
	},
});

interface CatColumnDataProps {
	cat: CatInfo & { id: number };
	eventCodes: string[];
	isGuaranteed?: boolean;
	onOpenCatDialog: () => void;
	onShowEvents: () => void;
}

const CatColumnData: React.FC<CatColumnDataProps> = ({
	cat,
	eventCodes,
	isGuaranteed = false,
	onOpenCatDialog,
	onShowEvents,
}) => {
	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={() => onOpenCatDialog()}
				className="p-1 border rounded cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900"
			>
				{cat.name[0]}
			</button>
			{!isGuaranteed && <RarityTag rarity={cat.rarity} />}
			{getCatTierRank(cat.id) && (
				<span className="px-1.5 py-0.5 text-xs font-semibold rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
					{getCatTierRank(cat.id)}
				</span>
			)}
			<button
				type="button"
				className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
				onClick={() => onShowEvents()}
			>
				<div>{eventCodes.length} events</div>
			</button>
		</div>
	);
};

interface Row {
	row: number;
	trackACats: Map<number, string[]>;
	trackAGuarantees: Map<number, string[]>;
	canSwitchFromA: string[];
	trackBCats: Map<number, string[]>;
	trackBGuarantees: Map<number, string[]>;
	canSwitchFromB: string[];
}

function App() {
	const { seed: requestedSeed } = Route.useSearch();
	const [seed, setSeed] = useCatSeed(requestedSeed);
	const { openCatDialog, openBookmarkManager } = useDialogs();

	const catDatabase = useCatDatabase();

	const rollMap: Row[] = Array.from({ length: 100 }, (_, index) => ({
		row: index,
		trackACats: new Map<number, string[]>(),
		trackAGuarantees: new Map<number, string[]>(),
		canSwitchFromA: [],
		trackBCats: new Map<number, string[]>(),
		trackBGuarantees: new Map<number, string[]>(),
		canSwitchFromB: [],
	}));
	if (catDatabase.data) {
		const eventOptions = getEventOptions(catDatabase.data.events).filter(
			(ev) => !ev.platinum,
		);
		eventOptions.forEach((eventData) => {
			const event = createGachaEvent(
				catDatabase.data.events[eventData.key],
				catDatabase.data,
			);
			const tracks = rollTracks(event, seed, 100);
			tracks.trackA.forEach((t, index) => {
				const prevCats = rollMap[index].trackACats.get(t.catId) ?? [];
				prevCats.push(eventData.key);
				rollMap[index].trackACats.set(t.catId, prevCats);
				if (t.switchedFromCatId)
					rollMap[index].canSwitchFromA.push(eventData.key);
				if (t.guaranteedUberId) {
					const prevGuarantees =
						rollMap[index].trackAGuarantees.get(t.guaranteedUberId) ?? [];
					prevGuarantees.push(eventData.key);
					rollMap[index].trackAGuarantees.set(
						t.guaranteedUberId,
						prevGuarantees,
					);
				}
			});
			tracks.trackB.forEach((t, index) => {
				const prevEvents = rollMap[index].trackBCats.get(t.catId) ?? [];
				prevEvents.push(eventData.key);
				rollMap[index].trackBCats.set(t.catId, prevEvents);
				if (t.switchedFromCatId)
					rollMap[index].canSwitchFromB.push(eventData.key);
				if (t.guaranteedUberId) {
					const prevGuarantees =
						rollMap[index].trackBGuarantees.get(t.guaranteedUberId) ?? [];
					prevGuarantees.push(eventData.key);
					rollMap[index].trackBGuarantees.set(
						t.guaranteedUberId,
						prevGuarantees,
					);
				}
			});
		});
	}

	const seedInputId = useId();

	const [dialogEventCodes, setDialogEventCodes] = useState<string[]>([]);
	const showEvents = (eventCodes: string[]) => {
		setDialogEventCodes(eventCodes);
	};
	const hideEvents = () => {
		setDialogEventCodes([]);
	};

	return (
		<div className="p-4 md:p-6 max-w-7xl mx-auto">
			<EventDetailsDialog
				isOpen={dialogEventCodes.length > 0}
				eventCodes={dialogEventCodes}
				onClose={hideEvents}
			/>
			<div className="flex items-center gap-3 mb-8">
				<div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/20">
					<Cat className="w-7 h-7 text-indigo-950" />
				</div>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
						Roll Planner
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						This shows rolls for all of the current and future events in that
						slot. Click on the events button to see which events will give you
						that cat.
					</p>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						To switch tracks, use a guaranteed roll or find a switch in the
						list.
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
				</div>
			</div>

			{/* map table */}
			<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
				<div className="px-6 py-5 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-slate-100/50 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
					<h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
						Next 100 Rolls
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full">
						<thead>
							<tr className="bg-slate-50/80 dark:bg-slate-800/80">
								<th className="w-10 px-3 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
									#
								</th>
								<th
									colSpan={2}
									className="px-3 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/50"
								>
									Track A
								</th>
								<th
									colSpan={2}
									className="px-3 py-3 text-center text-xs font-bold text-emerald-700 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/50"
								>
									Track B
								</th>
							</tr>
							<tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
								<th></th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700">
									Roll
								</th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 bg-amber-300/25 dark:bg-amber-900/25 uppercase tracking-wider">
									Guaranteed
								</th>

								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700">
									Roll
								</th>
								<th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 bg-amber-300/25 dark:bg-amber-900/25 uppercase tracking-wider">
									Guaranteed
								</th>
							</tr>
						</thead>
						<tbody>
							{rollMap.map((tr, ndx) => {
								return (
									<tr
										key={tr.row}
										className="hover:bg-slate-50/25 dark:hover:bg-slate-700/25 transition-colors border-b border-slate-200 dark:border-slate-700"
									>
										<td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-slate-400 dark:text-slate-500">
											{ndx + 1}
										</td>

										<td className="p-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
											<div className="flex flex-col gap-2">
												{Array.from(tr.trackACats.entries()).map(
													([catId, eventCodes]) => {
														if (!catDatabase.data) return null;
														const cat = {
															...catDatabase.data.cats[catId],
															id: catId,
														};
														return (
															cat && (
																<CatColumnData
																	key={catId}
																	cat={cat}
																	eventCodes={eventCodes}
																	onOpenCatDialog={() => openCatDialog(catId)}
																	onShowEvents={() => showEvents(eventCodes)}
																/>
															)
														);
													},
												)}
											</div>
											{tr.canSwitchFromA.length > 0 && (
												<div className="mt-4 flex gap-2 items-center text-slate-700 dark:text-slate-300">
													<b>&rarr; can switch tracks to {tr.row + 2}B</b>
													<button
														type="button"
														className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
														onClick={() => showEvents(tr.canSwitchFromA)}
													>
														{tr.canSwitchFromA.length} events
													</button>
												</div>
											)}
										</td>
										<td className="p-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-400 bg-amber-300/25 dark:bg-amber-900/25">
											<div className="flex flex-col gap-2">
												{Array.from(tr.trackAGuarantees.entries()).map(
													([catId, eventCodes]) => {
														if (!catDatabase.data) return null;
														const cat = {
															...catDatabase.data.cats[catId],
															id: catId,
														};
														return (
															cat && (
																<CatColumnData
																	key={catId}
																	cat={cat}
																	isGuaranteed
																	eventCodes={eventCodes}
																	onOpenCatDialog={() => openCatDialog(catId)}
																	onShowEvents={() => showEvents(eventCodes)}
																/>
															)
														);
													},
												)}
											</div>
										</td>

										<td className="p-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
											<div className="flex flex-col gap-2">
												{Array.from(tr.trackBCats.entries()).map(
													([catId, eventCodes]) => {
														if (!catDatabase.data) return null;
														const cat = {
															...catDatabase.data.cats[catId],
															id: catId,
														};
														return (
															cat && (
																<CatColumnData
																	key={catId}
																	cat={cat}
																	eventCodes={eventCodes}
																	onOpenCatDialog={() => openCatDialog(catId)}
																	onShowEvents={() => showEvents(eventCodes)}
																/>
															)
														);
													},
												)}
											</div>
											{tr.canSwitchFromB.length > 0 && (
												<div className="mt-4 flex gap-2 items-center text-slate-700 dark:text-slate-300">
													<b>&rarr; can switch tracks to {tr.row + 3}A</b>
													<button
														type="button"
														className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
														onClick={() => showEvents(tr.canSwitchFromB)}
													>
														{tr.canSwitchFromB.length} events
													</button>
												</div>
											)}
										</td>
										<td className="p-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-400 bg-amber-300/25 dark:bg-amber-900/25">
											<div className="flex flex-col gap-2">
												{Array.from(tr.trackBGuarantees.entries()).map(
													([catId, eventCodes]) => {
														if (!catDatabase.data) return null;
														const cat = {
															...catDatabase.data.cats[catId],
															id: catId,
														};
														return (
															cat && (
																<CatColumnData
																	key={catId}
																	cat={cat}
																	isGuaranteed
																	eventCodes={eventCodes}
																	onOpenCatDialog={() => openCatDialog(catId)}
																	onShowEvents={() => showEvents(eventCodes)}
																/>
															)
														);
													},
												)}
											</div>
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
