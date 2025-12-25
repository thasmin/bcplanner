import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Rarity } from "./data/battle-cats-gacha";
import type { CatDatabase, CatInfo } from "./data/gacha-data";

export function getCatStageImagePath(
	catId: string | number,
	stageIndex: number,
): string {
	const paddedId = `${catId}`.padStart(4, "0");
	return `/catImages/cat_${paddedId}_${stageIndex}.png`;
}

export function rarityShortName(rarity: number) {
	return ["N", "S", "R", "SR", "U", "L"][rarity] || "?";
}

export function rarityName(rarity: number) {
	return (
		["Normal", "Special", "Rare", "Super Rare", "Uber", "Legend"][rarity] ||
		"Unknown"
	);
}

export function getRarityBgClass(rarity?: number) {
	if (rarity === undefined) return "";
	if (rarity === Rarity.SuperRare) return "bg-blue-50 dark:bg-blue-950";
	if (rarity === Rarity.Uber) return "bg-yellow-50 dark:bg-yellow-950";
	if (rarity === Rarity.Legend) return "bg-purple-50 dark:bg-purple-950";
	return "";
}

export function getRarityColors(rarity: number) {
	if (rarity === Rarity.SuperRare)
		return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
	if (rarity === Rarity.Uber)
		return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
	if (rarity === Rarity.Legend)
		return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200";
	return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
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

export const useCatDatabase = () => {
	const catDatabaseQuery = useQuery({
		queryKey: ["catDatabase"],
		queryFn: async () => {
			const response = await fetch("/data/bc-en.json");
			return response.json() as Promise<CatDatabase>;
		},
		staleTime: Infinity, // Never refetch
	});
	return catDatabaseQuery;
};

export const useCatSeed = (requestedSeed?: number) => {
	const defaultSeedStr = localStorage.getItem("catSeed");
	const defaultSeed = defaultSeedStr ? +defaultSeedStr : 4255329801;
	const [seed, setSeed] = useState(requestedSeed ?? defaultSeed);
	const updateSeed = (newSeed: number) => {
		setSeed(newSeed);
		localStorage.setItem("catSeed", newSeed.toString());
		window.dispatchEvent(
			new StorageEvent("storage", {
				key: "catSeed",
				oldValue: seed.toString(),
				newValue: newSeed.toString(),
				storageArea: localStorage,
				url: window.location.href,
			}),
		);
	};
	useEffect(() => {
		function handleStorageChange(event: StorageEvent) {
			if (event.key === "catSeed" && event.newValue) setSeed(+event.newValue);
		}
		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);
	return [seed, updateSeed] as const;
};

export const useOwnedCats = () => {
	const getOwnedCats = (): Set<number> => {
		const ownedCatsStr = localStorage.getItem("ownedCats");
		return ownedCatsStr ? new Set(JSON.parse(ownedCatsStr)) : new Set();
	};

	const [ownedCats, setOwnedCats] = useState<Set<number>>(getOwnedCats());

	const toggleCat = (catId: number) => {
		const oldValue = JSON.stringify([...ownedCats]);
		const newOwnedCats = new Set(ownedCats);
		if (newOwnedCats.has(catId)) {
			newOwnedCats.delete(catId);
		} else {
			newOwnedCats.add(catId);
		}
		const newValue = JSON.stringify([...newOwnedCats]);
		setOwnedCats(newOwnedCats);
		localStorage.setItem("ownedCats", newValue);
		window.dispatchEvent(
			new StorageEvent("storage", {
				key: "ownedCats",
				oldValue,
				newValue,
				storageArea: localStorage,
				url: window.location.href,
			}),
		);
	};

	const setCatOwned = (catId: number, owned: boolean) => {
		const oldValue = JSON.stringify([...ownedCats]);
		const newOwnedCats = new Set(ownedCats);
		if (owned) {
			newOwnedCats.add(catId);
		} else {
			newOwnedCats.delete(catId);
		}
		const newValue = JSON.stringify([...newOwnedCats]);
		setOwnedCats(newOwnedCats);
		localStorage.setItem("ownedCats", newValue);
		window.dispatchEvent(
			new StorageEvent("storage", {
				key: "ownedCats",
				oldValue,
				newValue,
				storageArea: localStorage,
				url: window.location.href,
			}),
		);
	};

	useEffect(() => {
		function handleStorageChange(event: StorageEvent) {
			if (event.key === "ownedCats" && event.newValue) {
				setOwnedCats(new Set(JSON.parse(event.newValue)));
			}
		}
		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	return { ownedCats, toggleCat, setCatOwned };
};

export interface SeedBookmark {
	name: string;
	seed: number;
}

interface BookmarkState {
	master: number | null;
	bookmarks: SeedBookmark[];
}

export const useSeedBookmarks = () => {
	const getInitialState = (): BookmarkState => {
		const stored = localStorage.getItem("seedBookmarks");
		if (stored) {
			try {
				return JSON.parse(stored);
			} catch {
				return { master: null, bookmarks: [] };
			}
		}
		return { master: null, bookmarks: [] };
	};

	const [state, setState] = useState<BookmarkState>(getInitialState);

	const saveState = (newState: BookmarkState) => {
		setState(newState);
		localStorage.setItem("seedBookmarks", JSON.stringify(newState));
	};

	const setMasterBookmark = (seed: number) => {
		saveState({ ...state, master: seed });
	};

	const addBookmark = (name: string, seed: number) => {
		const newBookmark: SeedBookmark = { name, seed };
		const bookmarks = [...state.bookmarks, newBookmark];
		saveState({ ...state, bookmarks });
	};

	const deleteBookmark = (name: string) => {
		const bookmarks = state.bookmarks.filter((b) => b.name !== name);
		saveState({ ...state, bookmarks });
	};

	return {
		masterBookmark: state.master,
		bookmarks: state.bookmarks,
		setMasterBookmark,
		addBookmark,
		deleteBookmark,
	};
};

export function getCatTierRank(catId: number): string | undefined {
	for (const tier of tierList) {
		if (tier.cats.includes(catId)) {
			return tier.rank;
		}
	}
	for (const tier of evaTierList) {
		if (tier.cats.includes(catId)) return tier.rank;
	}
	return undefined;
}

export const banners: Array<[string, number[]]> = [
	["Dynamites", [43, 44, 45, 58, 60, 144, 428, 520, 618, 669, 764, 456]],
	["Vajiras", [72, 73, 74, 125, 126, 159, 339, 497, 619, 650, 755, 449]],
	[
		"Galaxy Gals",
		[76, 77, 106, 107, 108, 160, 352, 503, 620, 648, 734, 831, 450],
	],
	["Dragon Emperors", [84, 85, 86, 87, 88, 178, 397, 506, 621, 661, 761, 451]],
	["Ultra Souls", [135, 136, 137, 138, 139, 204, 323, 526, 634, 693, 770, 452]],
	["Dark Heroes", [195, 196, 197, 213, 227, 262, 432, 534, 635, 699, 775, 482]],
	["Almighties", [258, 259, 260, 272, 273, 317, 440, 535, 643, 724, 812, 494]],
	["Iron Legion", [305, 306, 307, 356, 418, 595, 633, 675, 716, 800, 464]],
	["Elemental Pixies", [360, 361, 362, 402, 570, 632, 656, 720, 818, 479]],
	["Girls & Monsters", [335, 336, 358, 359, 608, 726, 337, 825]],
	["Bikkuriman", [468, 469, 470, 471, 472, 556]],
	["Crash Fever", [327, 328]],
	[
		"Evangelion",
		[548, 710, 415, 413, 414, 489, 416, 815, 552, 488, 711, 551, 549, 417, 550],
	],
	["Fate/Stay Night: Heaven's Feel", [363, 364, 365, 366, 367, 368, 369, 457]],
	["Hatsune Miku", [536, 537, 538, 561, 583, 584, 591, 723]],
	["Metal Slug", [727, 222, 223, 224, 225, 226, 728]],
	["Mola", [175]],
	["Merc Storia", [186, 187, 188, 189, 120, 769, 506, 346, 347, 507]],
	["Power Pro Baseball", [394, 395, 396]],
	["Puella Magi Madoka Magica", [289, 290, 291, 292, 293, 441]],
	["Princess Punt Sweets", [162, 485, 338, 67, 486, 531]],
	["Puella Magi", [779]],
	["Ranma 1/2", [597, 598, 599, 600, 601, 672]],
	["River City Ransom", [625, 722]],
	["Rurouni Kenshin", [747, 748, 749, 750]],
	[
		"Street Fighter",
		[
			512, 513, 514, 515, 516, 517, 518, 572, 573, 574, 575, 576, 827, 828, 681,
			682,
		],
	],
	["Shoumetsu Toshi", [270, 483]],
	["Tower of Saviors", [742]],
	["Baki", [790, 791, 792, 793, 794, 795]],
	["Sonic the Hedgehog", [804, 805, 806, 807]],
	["Best of the Best", [759, 811, 784]],
	["Nekolugas", [35, 169, 170, 171, 172, 241, 437, 547, 626, 713, 782, 462]],
	["Li'l Valkyries", [436, 485]],
	["Busters", [284, 287, 398, 560, 687]],
	[
		"Dynasty Fest",
		[
			230, 231, 242, 243, 244, 275, 276, 303, 311, 331, 332, 355, 439, 495, 527,
			564, 565, 571, 585, 588, 589, 596, 615, 645, 649, 662, 667, 684, 688, 694,
			700, 712, 715, 737, 738, 757, 760, 773, 778, 787, 821, 587,
		],
	],
	[
		"RoyalFest",
		[613, 144, 213, 272, 303, 331, 497, 620, 634, 645, 662, 683, 688, 715],
	],
	["Uberfest", [270, 319, 381, 530, 586, 642, 691, 780, 732]],
	["Epicfest", [334, 379, 442, 544, 610, 658, 706, 788, 739]],
	["Unobtainable", [54, 181, 271, 342, 674]],
];

export const findBanner = (catId: number): string | undefined => {
	return banners.find(([_, catIds]) => catIds.includes(catId))?.[0];
};

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
			311, 506, 503, 398, 821, 648, 669, 360,
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

export const evaTierList = [
	{
		rank: "S",
		cats: [548, 710, 415],
	},
	{
		rank: "A",
		cats: [413, 414, 489],
	},
	{
		rank: "B",
		cats: [416, 815, 552, 550],
	},
	{
		rank: "C",
		cats: [488, 711, 551],
	},
	{
		rank: "D",
		cats: [549, 417],
	},
	{
		rank: "F",
		cats: [],
	},
];
