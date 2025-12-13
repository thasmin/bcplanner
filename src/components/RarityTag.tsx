import { getRarityColors, rarityName } from "@/utils";

function RarityTag({ rarity }: { rarity: number }) {
	return (
		<span
			className={`px-2 py-0.5 inline-flex text-xs leading-5 font-bold rounded-lg ${getRarityColors(rarity)}`}
		>
			{rarityName(rarity)}
		</span>
	);
}
export default RarityTag;
