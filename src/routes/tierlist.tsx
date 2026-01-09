import { createFileRoute } from "@tanstack/react-router";
import { ListOrdered } from "lucide-react";
import { useDialogs } from "@/contexts/DialogContext";
import type { CatDatabase } from "@/data/gacha-data";
import {
	evaTierList,
	getCatStageImagePath,
	sfTierList,
	tierList,
	useCatDatabase,
} from "@/utils";

export const Route = createFileRoute("/tierlist")({
	component: RouteComponent,
});

function getTierClass(rank: string): string {
	const tierMap: Record<string, string> = {
		SS: "tier-ss",
		"S+": "tier-s-plus",
		S: "tier-s",
		"A+": "tier-a-plus",
		A: "tier-a",
		"B+": "tier-b-plus",
		B: "tier-b",
		"C+": "tier-c-plus",
		C: "tier-c",
		D: "tier-d",
		F: "tier-f",
	};
	return tierMap[rank] || "bg-slate-200 text-slate-700";
}

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
				className="group"
				title={catFromDb.name[0]}
			>
				<div className="w-16 h-16 bg-white/60 dark:bg-slate-800/80 rounded-xl flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-950 group-hover:scale-110 group-hover:shadow-lg transition-all duration-200">
					<img
						alt={catFromDb.name[0]}
						src={getCatStageImagePath(catId, catFromDb.name.length - 1)}
						className="w-14 h-14 object-contain"
					/>
				</div>
			</button>
		);
	}
	console.error(`Cat id ${catId} not found in database`);
	return null;
};

const TierListTable: React.FC<{
	tierList: typeof tierList;
	onSelectCatId: (catId: number) => void;
}> = ({ tierList, onSelectCatId }) => {
	const catDatabase = useCatDatabase();

	return (
		<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
			{tierList
				.filter((tier) => tier.cats.length > 0)
				.map((tier) => (
					<div
						key={tier.rank}
						className="flex border-b border-slate-100 dark:border-slate-700 last:border-b-0"
					>
						<div
							className={`w-20 flex-shrink-0 flex items-center justify-center ${getTierClass(tier.rank)}`}
						>
							<span className="text-2xl font-black tracking-tight">
								{tier.rank}
							</span>
						</div>
						<div className="flex-1 p-4 bg-slate-50/30 dark:bg-slate-900/90">
							<ul className="flex flex-wrap gap-3">
								{tier.cats.map((catId) => {
									const catFromDb = catDatabase.data?.cats[catId];
									return (
										<li key={catId}>
											<TierCat
												catDatabase={catDatabase.data}
												catId={catId}
												onClick={() => catFromDb && onSelectCatId(catId)}
											/>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				))}
		</div>
	);
};

function RouteComponent() {
	const { openCatDialog } = useDialogs();

	return (
		<div className="p-4 md:p-6 max-w-7xl mx-auto">
			<div className="flex items-center gap-3 mb-8">
				<div className="p-3 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl shadow-lg shadow-violet-500/20">
					<ListOrdered className="w-7 h-7 text-violet-950" />
				</div>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
						Tier Lists
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						Cat rankings for strategic planning
					</p>
				</div>
			</div>

			<section className="mb-10">
				<div className="flex items-center gap-3 mb-4">
					<h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
						STREET FIGHTER Collab
					</h2>
					<span className="px-2 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
						Limited
					</span>
				</div>
				<TierListTable tierList={sfTierList} onSelectCatId={openCatDialog} />
			</section>

			<section>
				<h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">
					General Tier List
				</h2>
				<TierListTable tierList={tierList} onSelectCatId={openCatDialog} />
			</section>

			<section className="mb-10">
				<div className="flex items-center gap-3 mb-4">
					<h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
						EVANGELION Collab
					</h2>
					<span className="px-2 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
						Limited
					</span>
				</div>
				<TierListTable tierList={evaTierList} onSelectCatId={openCatDialog} />
			</section>
		</div>
	);
}
