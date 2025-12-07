import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useId, useState } from "react";

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
		id,
		...cat,
	}));

	// Filter cats based on search term and rarity
	const filteredCats = catsArray.filter((cat) => {
		const matchesSearch =
			searchTerm === "" ||
			cat.name.some((name) =>
				name.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		const matchesRarity = rarityFilter === "all" || cat.rarity === rarityFilter;
		return matchesSearch && matchesRarity;
	});

	return (
		<div className="p-4 max-w-7xl mx-auto">
			<div className="flex items-center gap-2 mb-6">
				<BookOpen className="w-8 h-8" />
				<h1 className="text-2xl font-bold">Cat Dictionary</h1>
			</div>

			<div className="bg-white rounded-lg shadow p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label
							htmlFor={searchInputId}
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Search:
						</label>
						<input
							type="text"
							id={searchInputId}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Search by name..."
						/>
					</div>

					<div>
						<label
							htmlFor={rarityInputId}
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Rarity Filter:
						</label>
						<select
							id={rarityInputId}
							value={rarityFilter}
							onChange={(e) =>
								setRarityFilter(
									e.target.value === "all" ? "all" : Number(e.target.value),
								)
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

				<div className="mt-4 text-sm text-gray-600">
					Showing {filteredCats.length} of {catsArray.length} cats
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredCats.map((cat) => {
					const imageUrl = imageMap.get(cat.name[0]);
					return (
						<div
							key={cat.id}
							className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
						>
							<div className="flex items-start p-4">
								<div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
									{imageUrl ? (
										<img
											src={imageUrl}
											alt={cat.name[0]}
											className="max-w-full max-h-full object-contain"
										/>
									) : (
										<div className="text-gray-400 text-xs text-center">
											No image
										</div>
									)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between mb-2">
										<h3 className="text-lg font-semibold text-gray-900 truncate">
											{cat.name[0]}
										</h3>
										<span className="ml-2 text-xs text-gray-500 flex-shrink-0">
											ID: {cat.id}
										</span>
									</div>

									<span
										className={`inline-block px-2 py-1 text-xs font-semibold rounded-full border mb-2 ${getRarityColors(
											cat.rarity,
										)}`}
									>
										{rarityName(cat.rarity)}
									</span>

									{cat.desc[0] && (
										<p className="text-sm text-gray-600 line-clamp-3">
											{cat.desc[0]}
										</p>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{filteredCats.length === 0 && (
				<div className="text-center py-12 text-gray-500">
					No cats found matching your search criteria.
				</div>
			)}
		</div>
	);
}
