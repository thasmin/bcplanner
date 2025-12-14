import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { getCatStageImagePath, useCatDatabase } from "@/utils";

export interface CatWithId {
	id: string | number;
	name: string[];
	desc: string[];
	rarity: number;
}

function rarityName(rarity: number) {
	return (
		["Normal", "Special", "Rare", "Super Rare", "Uber", "Legend"][rarity] ||
		"Unknown"
	);
}

function getRarityColors(rarity: number) {
	if (rarity === 4)
		return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300";
	if (rarity === 5)
		return "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-300";
	if (rarity === 3)
		return "bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800 border-blue-300";
	if (rarity === 2)
		return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300";
	return "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-300";
}

function getHeaderGradient(rarity: number) {
	if (rarity === 4) return "from-amber-500 to-yellow-400";
	if (rarity === 5) return "from-purple-600 to-violet-500";
	if (rarity === 3) return "from-blue-500 to-sky-400";
	if (rarity === 2) return "from-green-500 to-emerald-400";
	return "from-slate-600 to-gray-500";
}

interface CatDialogProps {
	catId?: number;
	onClose: () => void;
}

export function CatDialog({ catId, onClose }: CatDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	const catDatabase = useCatDatabase();
	const selectedCat = catId ? catDatabase.data?.cats[catId] : null;

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (catId) dialog.showModal();
		else dialog.close();
	}, [catId]);

	return (
		<dialog
			ref={dialogRef}
			closedby="any"
			className="backdrop:bg-black/70 backdrop:backdrop-blur-sm bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-0 m-auto border-0"
			onClose={onClose}
		>
			{selectedCat && (
				<>
					<div
						className={`sticky top-0 bg-gradient-to-r ${getHeaderGradient(selectedCat.rarity)} px-6 py-4 flex justify-between items-center`}
					>
						<div className="flex items-center gap-4">
							<h2 className="text-2xl font-bold text-white drop-shadow-sm">
								{selectedCat.name[0]}
							</h2>
							<span
								className={`inline-block px-3 py-1 text-xs font-bold rounded-lg border shadow-sm ${getRarityColors(
									selectedCat.rarity,
								)}`}
							>
								{rarityName(selectedCat.rarity)}
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

					<div className="p-6">
						<h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
							Evolution Stages
						</h3>

						<div className="flex flex-col gap-4">
							{catId &&
								selectedCat.name.map((_name, stageIndex) => {
									const imagePath = getCatStageImagePath(catId, stageIndex);
									const stageName =
										selectedCat.name[stageIndex] || `Stage ${stageIndex}`;
									const stageDesc = selectedCat.desc[stageIndex];

									return (
										<div
											key={_name}
											className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl px-5 py-4 flex gap-5 border border-slate-100"
										>
											<div className="flex-shrink-0 w-24 h-24 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-slate-100">
												<img
													src={imagePath}
													alt={stageName}
													className="max-w-full max-h-full object-contain"
													onError={(e) => {
														const target = e.target as HTMLImageElement;
														target.style.display = "none";
														const parent = target.parentElement;
														if (parent) {
															parent.innerHTML =
																'<div class="text-slate-300 text-xs">No image</div>';
														}
													}}
												/>
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-2">
													<span className="px-2 py-0.5 text-xs font-bold bg-slate-200 text-slate-600 rounded-md">
														Stage {stageIndex + 1}
													</span>
												</div>
												<h4 className="text-lg font-bold text-slate-800 mb-2">
													{stageName}
												</h4>
												{stageDesc && (
													<p className="text-sm text-slate-500 leading-relaxed">
														{stageDesc}
													</p>
												)}
											</div>
										</div>
									);
								})}
						</div>
					</div>
				</>
			)}
		</dialog>
	);
}
