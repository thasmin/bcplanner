import { getRarityColors, rarityName } from "@/utils";

function RarityTag({ rarity }: { rarity: number }) {
	return (
		<span
			className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRarityColors(rarity)}`}
		>
			{rarityName(rarity)}
		</span>
	);
}
export default RarityTag;
