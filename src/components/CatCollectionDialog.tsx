import { Check, Database, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDialogs } from "@/contexts/DialogContext";
import {
	banners,
	getCatStageImagePath,
	useCatDatabase,
	useOwnedCats,
} from "@/utils";

interface CatCollectionDialogProps {
	isOpen: boolean;
	onClose: () => void;
}

function rarityName(rarity: number) {
	return (
		["Normal", "Special", "Rare", "Super Rare", "Uber", "Legend"][rarity] ||
		"Unknown"
	);
}

function getRarityColors(rarity: number) {
	if (rarity === 4)
		return "bg-gradient-to-r from-amber-100 dark:from-amber-900 to-yellow-100 dark:to-yellow-900 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700";
	if (rarity === 5)
		return "bg-gradient-to-r from-purple-100 dark:from-purple-900 to-violet-100 dark:to-violet-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700";
	if (rarity === 3)
		return "bg-gradient-to-r from-blue-100 dark:from-blue-900 to-sky-100 dark:to-sky-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700";
	if (rarity === 2)
		return "bg-gradient-to-r from-green-100 dark:from-green-900 to-emerald-100 dark:to-emerald-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700";
	return "bg-gradient-to-r from-slate-100 dark:from-slate-800 to-gray-100 dark:to-gray-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600";
}

export function CatCollectionDialog({
	isOpen,
	onClose,
}: CatCollectionDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const { ownedCats, toggleCat } = useOwnedCats();
	const catDatabase = useCatDatabase();
	const { openCatDialog } = useDialogs();
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (isOpen) dialog.showModal();
		else dialog.close();
	}, [isOpen]);

	if (!catDatabase.data) return null;

	// Filter banners based on search term
	const filteredBanners = banners
		.map(([bannerName, catIds]) => {
			const filteredCats = catIds.filter((catId) => {
				const cat = catDatabase.data?.cats[catId];
				if (!cat) return false;
				if (!searchTerm) return true;
				return (
					cat.name?.some((name) =>
						name.toLowerCase().includes(searchTerm.toLowerCase()),
					) || bannerName.toLowerCase().includes(searchTerm.toLowerCase())
				);
			});
			return [bannerName, filteredCats] as [string, number[]];
		})
		.filter(([_, catIds]) => catIds.length > 0);

	// Calculate stats
	const totalCats = banners.reduce(
		(acc, [_, catIds]) => acc + catIds.length,
		0,
	);
	const ownedCount = ownedCats.size;

	return (
		<dialog
			ref={dialogRef}
			closedby="any"
			className="backdrop:bg-black/70 dark:backdrop:bg-black/80 backdrop:backdrop-blur-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto p-0 m-auto border-0"
			onClose={onClose}
		>
			<div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex justify-between items-center z-10">
				<div className="flex items-center gap-3">
					<Database className="w-6 h-6 text-white" />
					<h2 className="text-2xl font-bold text-white drop-shadow-sm">
						Cat Collection
					</h2>
					<span className="px-3 py-1 text-sm font-bold bg-white/20 text-white rounded-lg">
						{ownedCount} / {totalCats}
					</span>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/90 hover:text-white"
					aria-label="Close"
				>
					<X className="w-6 h-6" />
				</button>
			</div>

			<div className="p-6 space-y-6">
				{/* Search bar */}
				<div className="sticky top-[72px] bg-white dark:bg-slate-800 pb-4 z-10">
					<input
						type="text"
						placeholder="Search cats or banners..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
					/>
				</div>

				{/* Banners list */}
				{filteredBanners.map(([bannerName, catIds]) => {
					const bannerOwnedCount = catIds.filter((id) =>
						ownedCats.has(id),
					).length;

					return (
						<div
							key={bannerName}
							className="bg-gradient-to-br from-slate-50 dark:from-slate-900 to-slate-100/50 dark:to-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700"
						>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
									{bannerName}
								</h3>
								<span className="px-3 py-1 text-sm font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
									{bannerOwnedCount} / {catIds.length}
								</span>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
								{catIds.map((catId) => {
									const cat = catDatabase.data?.cats[catId];
									if (!cat) return null;

									const isOwned = ownedCats.has(catId);
									const imagePath = getCatStageImagePath(catId, 0);

									return (
										<div
											key={catId}
											className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
												isOwned
													? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600"
													: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
											}`}
										>
											<button
												type="button"
												onClick={() => toggleCat(catId)}
												className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all ${
													isOwned
														? "bg-emerald-500 border-emerald-600"
														: "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
												}`}
											>
												{isOwned && <Check className="w-6 h-6 text-white" />}
											</button>

											<button
												type="button"
												onClick={() => openCatDialog(catId)}
												className="flex-shrink-0 w-12 h-10 bg-black rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600"
											>
												<img
													src={imagePath}
													alt={cat.name[0]}
													className="max-w-full max-h-full object-cover"
													onError={(e) => {
														const target = e.target as HTMLImageElement;
														target.style.display = "none";
													}}
												/>
											</button>

											<button
												type="button"
												onClick={() => openCatDialog(catId)}
												className="flex-1 min-w-0 text-left"
											>
												<div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
													{cat.name[0]}
												</div>
												<span
													className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md mt-1 ${getRarityColors(
														cat.rarity,
													)}`}
												>
													{rarityName(cat.rarity)}
												</span>
											</button>
										</div>
									);
								})}
							</div>
						</div>
					);
				})}

				{filteredBanners.length === 0 && (
					<div className="text-center py-12 text-slate-500 dark:text-slate-400">
						No cats found matching "{searchTerm}"
					</div>
				)}
			</div>
		</dialog>
	);
}
