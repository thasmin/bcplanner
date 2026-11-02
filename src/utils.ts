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
	for (const tier of sfTierList) {
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
		rank: "SSS",
		cats: [860, 838],
	},
	{
		rank: "SS",
		cats: [780, 136, 138, 45, 520, 732, 706, 544, 691, 273, 178],
	},
	{
		rank: "S+",
		cats: [428, 60, 77, 432, 195, 272, 317, 259, 361, 788],
	},
	{
		rank: "S",
		cats: [
			72, 73, 107, 106, 76, 262, 440, 535, 626, 171, 713, 687, 560, 319, 442,
		],
	},
	{
		rank: "S-",
		cats: [661, 197, 699, 643, 305, 633, 337, 759, 811],
	},
	{
		rank: "A+",
		cats: [
			497, 126, 108, 160, 693, 534, 227, 812, 260, 418, 570, 784, 334, 684,
		],
	},
	{
		rank: "A",
		cats: [
			43, 618, 125, 159, 620, 621, 452, 323, 526, 139, 213, 494, 306, 307, 595,
			464, 545, 608, 683, 335, 874, 270, 530, 739, 564, 715,
		],
	},
	{
		rank: "A-",
		cats: [
			650, 755, 397, 137, 332, 724, 258, 360, 172, 169, 586, 658, 379, 610, 757,
		],
	},
	{
		rank: "B+",
		cats: [
			648, 831, 451, 761, 204, 196, 800, 356, 336, 381, 642, 738, 700, 863, 694,
			787,
		],
	},
	{
		rank: "B",
		cats: [
			456, 669, 764, 619, 450, 503, 734, 862, 634, 135, 482, 775, 479, 632, 284,
			287, 571,
		],
	},
	{
		rank: "B-",
		cats: [44, 449, 339, 716, 402, 358, 398, 587],
	},
	{
		rank: "C+",
		cats: [352, 635, 825, 782, 613, 276, 760, 873],
	},
	{
		rank: "C",
		cats: [58, 74, 84, 88, 656, 362, 241, 170, 485, 436, 588, 275, 662, 311],
	},
	{
		rank: "C-",
		cats: [851, 86, 726, 462, 585],
	},
	{
		rank: "D+",
		cats: [770, 720, 35, 331],
	},
	{
		rank: "D",
		cats: [144, 506, 645, 355, 821, 230, 773, 565, 778, 242],
	},
	{
		rank: "D-",
		cats: [87, 85, 527, 688],
	},
	{
		rank: "E+",
		cats: [596, 615],
	},
	{
		rank: "E",
		cats: [359, 737, 649],
	},
	{
		rank: "E-",
		cats: [870, 231],
	},
	{
		rank: "F+",
		cats: [818, 437, 667, 303],
	},
	{
		rank: "F",
		cats: [675],
	},
	{
		rank: "F-",
		cats: [547, 837, 589, 495, 439, 712, 243, 244],
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

export const sfTierList = [
	{
		rank: "S",
		cats: [828],
	},
	{
		rank: "A",
		cats: [511, 516, 513],
	},
	{
		rank: "B",
		cats: [682, 518, 827, 681],
	},
	{
		rank: "C",
		cats: [576, 573, 512, 574, 514],
	},
	{
		rank: "D",
		cats: [575, 515],
	},
	{
		rank: "F",
		cats: [517, 572],
	},
];
