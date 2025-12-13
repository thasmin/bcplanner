import { Rarity } from "./data/battle-cats-gacha";
import type { CatDatabase, CatInfo } from "./data/gacha-data";

export function getCatStageImagePath(
	catId: string | number,
	stageIndex: number,
): string {
	const paddedId = `${catId}`.padStart(4, "0");
	return `/catImages/cat_${paddedId}_${stageIndex}.png`;
}

export function rarityName(rarity: number) {
	return (
		["Normal", "Special", "Rare", "Super Rare", "Uber", "Legend"][rarity] ||
		"Unknown"
	);
}

export function getRarityBgClass(rarity?: number) {
	if (rarity === undefined) return "";
	if (rarity === Rarity.SuperRare) return "bg-blue-50";
	if (rarity === Rarity.Uber) return "bg-yellow-50";
	if (rarity === Rarity.Legend) return "bg-purple-50";
	return "";
}

export function getRarityColors(rarity: number) {
	if (rarity === Rarity.SuperRare) return "bg-blue-100 text-blue-800";
	if (rarity === Rarity.Uber) return "bg-yellow-100 text-yellow-800";
	if (rarity === Rarity.Legend) return "bg-purple-100 text-purple-800";
	return "bg-gray-100 text-gray-800";
}

export interface CatRowData {
	id: number;
	rarity: number;
	name: string;
}

export function lookupCat(catDatabase: CatDatabase, catId: number): CatRowData;
export function lookupCat(
	catDatabase: CatDatabase,
	catId: number | undefined,
): CatRowData | undefined;
export function lookupCat(
	catDatabase: CatDatabase,
	catId: number | undefined,
): CatRowData | undefined {
	if (!catId) return undefined;
	const cat =
		catDatabase?.cats[catId] ||
		({
			id: catId,
			name: ["Unknown"],
			desc: [],
			rarity: 0,
			max_level: 0,
		} as CatInfo);
	return {
		id: catId,
		rarity: cat.rarity,
		name: cat.name[0],
	};
}

export function getCatTierRank(catId: number): string | undefined {
	for (const tier of tierList) {
		if (tier.cats.includes(catId)) {
			return tier.rank;
		}
	}
	return undefined;
}

export const tierList = [
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
			633, 570, 172, 699, 713, 661, 270, 307, 323, 336, 358, 169, 260, 227, 160,
			306, 684, 784, 687, 812, 683, 126,
		],
	},
	{
		rank: "A",
		cats: [
			379, 139, 334, 586, 44, 530, 739, 534, 724, 494, 452, 169, 658, 171, 693,
			618, 335, 418, 464, 197, 356, 642, 643, 381, 619, 361, 108, 526, 595, 196,
			43,
		],
	},
	{
		rank: "B+",
		cats: [
			764, 610, 608, 545, 482, 306, 757, 479, 332, 284, 787, 621, 337, 585, 761,
			800, 397, 650, 287, 564, 700,
		],
	},
	{
		rank: "B",
		cats: [
			137, 632, 587, 485, 620, 135, 716, 241, 450, 715, 456, 662, 760, 571, 634,
			311, 506, 503, 398, 821, 648, 669,
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
