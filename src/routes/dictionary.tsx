import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useId, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useDialogs } from "@/contexts/DialogContext";

export const Route = createFileRoute("/dictionary")({ component: Dictionary });

interface CatImage {
	name: string;
	imageUrl: string;
}

interface CatData {
	name: string[];
	desc: string[];
	rarity: number;
}

interface CatDatabase {
	cats: Record<string, CatData>;
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

async function loadCatDatabase(): Promise<CatDatabase> {
	const response = await fetch("/data/bc-en.json");
	if (!response.ok) throw new Error("Failed to load cat database");
	return response.json();
}

async function loadCatImages(): Promise<CatImage[]> {
	const response = await fetch("/data/images.json");
	if (!response.ok) throw new Error("Failed to load cat images");
	return response.json();
}

function Dictionary() {
	const [searchTerm, setSearchTerm] = useState("");
	const [rarityFilter, setRarityFilter] = useState<number | "all">("all");
	const { openCatDialog } = useDialogs();
	const searchInputId = useId();
	const rarityInputId = useId();

	const catDatabaseQuery = useQuery({
		queryKey: ["catDatabase"],
		queryFn: loadCatDatabase,
		staleTime: Infinity,
	});

	const catImagesQuery = useQuery({
		queryKey: ["catImages"],
		queryFn: loadCatImages,
		staleTime: Infinity,
	});

	if (catDatabaseQuery.isLoading || catImagesQuery.isLoading) {
		return (
			<div className="p-4 max-w-7xl mx-auto">
				<div className="text-gray-600">Loading cat dictionary...</div>
			</div>
		);
	}

	if (catDatabaseQuery.error || catImagesQuery.error) {
		return (
			<div className="p-4 max-w-7xl mx-auto">
				<div className="text-red-600">Error loading cat dictionary</div>
			</div>
		);
	}

	const catDatabase = catDatabaseQuery.data;
	const catImages = catImagesQuery.data;

	if (!catDatabase || !catImages) {
		return null;
	}

	// Create a mapping from cat names to image URLs
	const imageMap = new Map<string, string>();
	for (const catImage of catImages) {
		imageMap.set(catImage.name, catImage.imageUrl);
	}

	// Convert cats object to array with IDs
	const catsArray = Object.entries(catDatabase.cats).map(([id, cat]) => ({
		id: +id,
		...cat,
	}));

	// Filter cats based on search term and rarity
	const filteredCats = catsArray.filter((cat) => {
		const matchesSearch =
			searchTerm === "" ||
			cat.id.toString() === searchTerm ||
			cat.name.some((name) =>
				name.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		const matchesRarity = rarityFilter === "all" || cat.rarity === rarityFilter;
		return matchesSearch && matchesRarity;
	});

	return (
		<div className="page-shell">
			<PageHeader
				icon={BookOpen}
				title="Cat Dictionary"
				tone="teal"
				description="Browse every cat by name, number, or rarity."
			/>

			<div className="app-panel mb-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label
							htmlFor={searchInputId}
							className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
						>
							Search
						</label>
						<input
							type="text"
							id={searchInputId}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="control"
							placeholder="Search by name or ID..."
						/>
					</div>

					<div>
						<label
							htmlFor={rarityInputId}
							className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
						>
							Rarity Filter
						</label>
						<select
							id={rarityInputId}
							value={rarityFilter}
							onChange={(e) =>
								setRarityFilter(
									e.target.value === "all" ? "all" : Number(e.target.value),
								)
							}
							className="control cursor-pointer"
						>
							<option value="all">All Rarities</option>
							<option value="0">Normal</option>
							<option value="1">Special</option>
							<option value="2">Rare</option>
							<option value="3">Super Rare</option>
							<option value="4">Uber</option>
							<option value="5">Legend</option>
						</select>
					</div>
				</div>

				<div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
					<span className="px-2 py-1 text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium">
						{filteredCats.length}
					</span>
					<span>of {catsArray.length} cats</span>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{filteredCats.map((cat) => {
					const imageUrl = imageMap.get(cat.name[0]);
					return (
						<button
							type="button"
							key={cat.id}
							className="app-panel text-left overflow-hidden hover:border-slate-400 dark:hover:border-slate-500 transition-colors group"
							onClick={() => openCatDialog(cat.id)}
						>
							<div className="flex items-start p-4">
								<div className="cat-image-well flex-shrink-0 w-24 h-24 rounded-md flex items-center justify-center mr-4">
									{imageUrl ? (
										<img
											src={imageUrl}
											alt={cat.name[0]}
											className="max-w-full max-h-full object-contain"
										/>
									) : (
										<div className="text-slate-300 dark:text-slate-500 text-xs text-center">
											No image
										</div>
									)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between mb-2">
										<h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
											{cat.name[0]}
										</h3>
										<span className="ml-2 text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 font-mono">
											#{cat.id}
										</span>
									</div>

									<span
										className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border mb-2 ${getRarityColors(
											cat.rarity,
										)}`}
									>
										{rarityName(cat.rarity)}
									</span>

									{cat.desc[0] && (
										<p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
											{cat.desc[0]}
										</p>
									)}
								</div>
							</div>
						</button>
					);
				})}
			</div>

			{filteredCats.length === 0 && (
				<div className="text-center py-16 text-slate-400">
					<div className="text-4xl mb-3">🐱</div>
					<p className="font-medium">No cats found</p>
					<p className="text-sm">Try adjusting your search or filter</p>
				</div>
			)}
		</div>
	);
}
