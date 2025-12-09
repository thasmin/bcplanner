import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CatDialog, type CatWithId } from "@/components/CatDialog";
import { type CatDatabase, loadCatDatabase } from "@/data/gacha-data";
import { getCatStageImagePath, tierList } from "@/utils";

export const Route = createFileRoute("/tierlist")({
	component: RouteComponent,
});

const TierCat: React.FC<{
	catDatabase?: CatDatabase;
	catId: number;
	onClick?: () => void;
}> = ({ catDatabase, catId, onClick }) => {
	const catFromDb = catDatabase?.cats[catId];
	if (catFromDb) {
		return (
			<button
				type="button"
				onClick={onClick}
				className="cursor-pointer hover:scale-110 transition-transform"
			>
				<img
					alt={catFromDb.name[0]}
					src={getCatStageImagePath(catId, catFromDb.name.length - 1)}
					title={catFromDb.name[0]}
					className="w-16 h-16 object-contain"
				/>
			</button>
		);
	}
	console.error(`Cat id ${catId} not found in database`);
	return null;
};

function RouteComponent() {
	const [selectedCat, setSelectedCat] = useState<CatWithId | null>(null);

	// Load cat database
	const catDatabaseQuery = useQuery({
		queryKey: ["catDatabase"],
		queryFn: loadCatDatabase,
		staleTime: Infinity, // Never refetch
	});
	const catDatabase = catDatabaseQuery.data;

	return (
		<div className="p-4 max-w-7xl mx-auto">
			<h1 className="text-4xl my-4">Tier list</h1>
			<table className="w-full border-collapse border border-gray-400">
				<thead>
					<tr>
						<th className="border border-gray-400 px-4 py-2">Rank</th>
						<th className="border border-gray-400 px-4 py-2">Cats</th>
					</tr>
				</thead>
				<tbody>
					{tierList.map((tier) => (
						<tr key={tier.rank}>
							<td className="border border-gray-400 px-4 py-2 align-top font-bold">
								{tier.rank}
							</td>
							<td className="border border-gray-400 px-4 py-2">
								<ul className="flex flex-wrap gap-4">
									{tier.cats.map((catId) => {
										const catFromDb = catDatabase?.cats[catId];
										return (
											<li key={catId}>
												<TierCat
													catDatabase={catDatabase}
													catId={catId}
													onClick={() => {
														if (catFromDb) {
															setSelectedCat({
																id: catId,
																name: catFromDb.name,
																desc: catFromDb.desc,
																rarity: catFromDb.rarity,
															});
														}
													}}
												/>
											</li>
										);
									})}
								</ul>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<CatDialog
				selectedCat={selectedCat}
				onClose={() => setSelectedCat(null)}
			/>
		</div>
	);
}
