import { getCatTierRank, getRarityColors, rarityShortName } from "@/utils";

function RarityTag({ catId, rarity }: { catId: number; rarity: number }) {
	const tier = getCatTierRank(catId);
	return (
		<span
			className={`px-2 py-0.5 inline-flex items-baseline text-xs leading-5 font-bold rounded-lg ${getRarityColors(rarity)}`}
		>
			<span>{rarityShortName(rarity)}</span>
			{tier && <span className="ml-0.5"> - {tier} </span>}
		</span>
	);
}
export default RarityTag;
