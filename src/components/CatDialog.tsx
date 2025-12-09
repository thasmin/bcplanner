import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { getCatStageImagePath } from "@/utils";

export interface CatWithId {
	id: string;
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
	if (rarity === 4) return "bg-yellow-100 text-yellow-800 border-yellow-300";
	if (rarity === 5) return "bg-purple-100 text-purple-800 border-purple-300";
	if (rarity === 3) return "bg-blue-100 text-blue-800 border-blue-300";
	if (rarity === 2) return "bg-green-100 text-green-800 border-green-300";
	return "bg-gray-100 text-gray-800 border-gray-300";
}

interface CatDialogProps {
	selectedCat: CatWithId | null;
	onClose: () => void;
}

export function CatDialog({ selectedCat, onClose }: CatDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (selectedCat) dialog.showModal();
		else dialog.close();
	}, [selectedCat]);

	return (
		<dialog
			ref={dialogRef}
			closedby="any"
			className="backdrop:bg-black backdrop:opacity-80 bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-0 m-auto"
			onClose={onClose}
		>
			{selectedCat && (
				<>
					<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-2 flex justify-between items-center">
						<div className="flex items-center">
							<h2 className="flex items-center gap-4">
								<div className="text-2xl font-bold text-gray-900">
									{selectedCat.name[0]}
								</div>
								<span
									className={`inline-block px-2 py-1 text-xs font-semibold rounded-full border ${getRarityColors(
										selectedCat.rarity,
									)}`}
								>
									{rarityName(selectedCat.rarity)}
								</span>
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
							aria-label="Close"
						>
							<X className="w-6 h-6" />
						</button>
					</div>

					<div className="p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Evolution Stages
						</h3>

						<div className="flex flex-col gap-4">
							{selectedCat.name.map((_name, stageIndex) => {
								const imagePath = getCatStageImagePath(
									selectedCat.id,
									stageIndex,
								);
								const stageName =
									selectedCat.name[stageIndex] || `Stage ${stageIndex}`;
								const stageDesc = selectedCat.desc[stageIndex];

								return (
									<div
										key={_name}
										className="bg-gray-50 rounded-lg px-4 py-2 flex gap-4"
									>
										<div className="flex-shrink-0 w-24 h-24 bg-white rounded-lg flex items-center justify-center overflow-hidden">
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
															'<div class="text-gray-400 text-xs">No image</div>';
													}
												}}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<h4 className="text-lg font-semibold text-gray-900 mb-2">
												{stageName}
											</h4>
											{stageDesc && (
												<p className="text-sm text-gray-600 leading-relaxed">
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
