import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CatDialog, type CatWithId } from "@/components/CatDialog";
import { type CatDatabase, loadCatDatabase } from "@/data/gacha-data";
import { getCatStageImagePath } from "@/utils";

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

	const tiers = [
		{
			rank: "SS",
			cats: [520, 45, 138, 706, 544, 732, 136, 691, 178, 273],
		},
		{
			rank: "S+",
			cats: [272, 788, 432, 259, 319, 662, 107, 535, 73, 262, 780, 60],
		},
		{
			rank: "S",
			cats: [560, 195, 72, 106, 317, 811, 77, 76, 305, 442, 626, 759],
		},
		{
			rank: "A+",
			cats: [
				633, 570, 172, 699, 713, 661, 270, 307, 323, 336, 358, 169, 260, 227,
				160, 306, 684, 784, 687, 812, 683, 126,
			],
		},
		{
			rank: "A",
			cats: [
				379, 139, 334, 586, 44, 530, 739, 534, 724, 494, 452, 169, 658, 171,
				693, 618, 335, 418, 464, 197, 356, 642, 643, 381, 619, 361, 108, 526,
				595, 196, 43,
			],
		},
		{
			rank: "B+",
			cats: [
				764, 610, 608, 545, 482, 306, 757, 479, 332, 284, 787, 621, 337, 585,
				761, 800, 397, 650, 287, 564, 700,
			],
		},
		{
			rank: "B",
			cats: [
				137, 632, 587, 485, 620, 135, 716, 241, 450, 715, 456, 662, 760, 571,
				634, 311, 506, 503, 398, 821, 648, 669,
			],
		},
		{
			rank: "C+",
			cats: [
				352, 213, 276, 635, 28, 331, 204, 497, 362, 738, 402, 436, 88, 449, 497,
				588, 258, 726, 755, 775, 782,
			],
		},
		{
			rank: "C",
			cats: [
				58, 451, 170, 462, 527, 359, 74, 275, 84, 86, 230, 649, 615, 656, 770,
				694, 825, 734,
			],
		},
		{
			rank: "D",
			cats: [
				35, 737, 596, 87, 144, 242, 85, 125, 355, 428, 231, 720, 675, 645, 303,
				339, 437, 688, 773, 667, 818,
			],
		},
		{
			rank: "F",
			cats: [495, 712, 589, 243, 244, 439, 565, 547],
		},
	];

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
					{tiers.map((tier) => (
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
