/**
 * Battle Cats Gacha Roll Simulator
 *
 * This module simulates the gacha roll mechanics from Battle Cats,
 * allowing you to predict the next N rolls given a seed and event configuration.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum Rarity {
	Normal = 0,
	Special = 1,
	Rare = 2,
	SuperRare = 3,
	Uber = 4,
	Legend = 5,
}

export interface GachaEvent {
	/** Event ID */
	id: number | string;
	/** Cat IDs available in this event, grouped by rarity */
	slots: {
		[Rarity.Normal]?: number[];
		[Rarity.Special]?: number[];
		[Rarity.Rare]?: number[];
		[Rarity.SuperRare]?: number[];
		[Rarity.Uber]?: number[];
		[Rarity.Legend]?: number[];
	};
	/** Rarity rates (out of 10000) */
	rates: {
		rare: number; // e.g., 7000 = 70%
		supa: number; // e.g., 2500 = 25%
		uber: number; // e.g., 500 = 5%
		// legend is calculated as: 10000 - rare - supa - uber
	};
}

export interface RollResult {
	/** Roll number (1-indexed) */
	rollNumber: number;
	/** Seed used for this roll */
	seed: number;
	/** Rarity of the cat */
	rarity: Rarity;
	/** Rarity name */
	rarityName: string;
	/** Cat ID */
	catId: number;
	/** Slot index within the rarity pool */
	slot: number;
	/** Score used for rarity determination (0-9999) */
	score: number;
	/** Track (0 = A, 1 = B) */
	track?: number;
	/** Is this a guaranteed uber roll? */
	isGuaranteed?: boolean;
	/** Will this roll switch tracks */
	switchTracks?: boolean;
	/** If switched from another cat ID */
	switchedFromCatId?: number;
}

// ============================================================================
// XORShift32 Random Number Generator
// ============================================================================

const UINT32_MAX = 0x100000000;

/**
 * Advances the seed using XORShift32 algorithm
 * This is the core RNG used by Battle Cats
 */
export function advanceSeed(seed: number): number {
	seed = xorShift(seed, "<<", 13);
	seed = xorShift(seed, ">>", 17);
	seed = xorShift(seed, "<<", 15);
	return seed;
}

/**
 * XOR shift operation with modulo to keep within 32-bit unsigned range
 */
function xorShift(seed: number, direction: "<<" | ">>", bits: number): number {
	if (direction === "<<") {
		return ((seed ^ (seed << bits)) >>> 0) % UINT32_MAX;
	} else {
		return ((seed ^ (seed >>> bits)) >>> 0) % UINT32_MAX;
	}
}

/**
 * Retreats the seed (reverse of advanceSeed)
 * Useful for finding previous states
 */
export function retreatSeed(seed: number): number {
	seed = xorShift(seed, "<<", 26);
	seed = xorShift(seed, "<<", 13);
	seed = xorShift(seed, ">>", 17);
	seed = xorShift(seed, "<<", 30);
	seed = xorShift(seed, "<<", 15);
	return seed;
}

// ============================================================================
// Rarity Calculation
// ============================================================================

const BASE = 10000;

/**
 * Determines rarity based on score and event rates
 */
function determineRarity(score: number, rates: GachaEvent["rates"]): Rarity {
	const { rare, supa, uber } = rates;
	const rareSupa = rare + supa;
	const rareSupaUber = rareSupa + uber;

	if (score < rare) {
		return Rarity.Rare;
	} else if (score < rareSupa) {
		return Rarity.SuperRare;
	} else if (score < rareSupaUber) {
		return Rarity.Uber;
	} else {
		return Rarity.Legend;
	}
}

function rarityToString(rarity: Rarity): string {
	switch (rarity) {
		case Rarity.Normal:
			return "Normal";
		case Rarity.Special:
			return "Special";
		case Rarity.Rare:
			return "Rare";
		case Rarity.SuperRare:
			return "Super Rare";
		case Rarity.Uber:
			return "Uber";
		case Rarity.Legend:
			return "Legend";
	}
}

// ============================================================================
// Cat Selection
// ============================================================================

/**
 * Selects a cat from the pool based on slot value and rarity
 */
function selectCat(
	slotValue: number,
	rarity: Rarity,
	event: GachaEvent,
): { catId: number; slot: number } {
	const pool = event.slots[rarity] || [];

	if (pool.length === 0) {
		// No cats available for this rarity
		return { catId: -1, slot: -1 };
	}

	const slot = ((slotValue % pool.length) + pool.length) % pool.length;
	const catId = pool[slot];

	return { catId, slot };
}

/**
 * Rerolls a duplicate cat by advancing the seed and removing occupied slots
 *
 * This mirrors the algorithm in lib/battle-cats-rolls/gacha.rb:183-216
 *
 * The algorithm works by:
 * 1. Creating a copy of the rarity pool
 * 2. Advancing the seed and removing the previous slot from the pool
 * 3. Calculating a new slot position in the shrunk pool
 * 4. Repeating until a different cat is found
 *
 * @param slotSeed - The seed value used for slot selection
 * @param originalCatId - The cat ID that was duplicated
 * @param originalSlot - The original slot index
 * @param rarity - The rarity of the cat
 * @param event - The gacha event configuration
 * @returns The rerolled cat info, or null if no different cat could be found
 */
function rerollCat(
	slotSeed: number,
	originalCatId: number,
	originalSlot: number,
	rarity: Rarity,
	event: GachaEvent,
): { catId: number; slot: number; steps: number } | null {
	const originalPool = event.slots[rarity] || [];
	if (originalPool.length === 0) return null;
	const rerollingSlots = [...originalPool];

	let currentSeed = slotSeed;
	let slot = originalSlot;
	const duplicateCount = originalPool.filter(
		(id) => id === originalCatId,
	).length;

	for (let steps = 1; steps <= duplicateCount; steps++) {
		currentSeed = advanceSeed(currentSeed);
		rerollingSlots.splice(slot, 1);
		if (rerollingSlots.length === 0) return null;
		slot = currentSeed % rerollingSlots.length;
		const newCatId = rerollingSlots[slot];
		if (newCatId !== originalCatId) return { catId: newCatId, slot, steps };
	}

	return null;
}

// ============================================================================
// Main Gacha Roll Function
// ============================================================================

/**
 * Simulates a single gacha roll
 */
export function rollOnce(
	seed: number,
	event: GachaEvent,
	lastCatId?: number,
): { result: RollResult; nextSeed: number } {
	const score = seed % BASE;
	const rarity = determineRarity(score, event.rates);
	const nextSeed = advanceSeed(seed);
	let { catId, slot } = selectCat(nextSeed, rarity, event);

	// Check for duplicates and reroll if necessary
	let switchedFromCatId: number | undefined;
	if (catId === lastCatId) {
		const rerollResult = rerollCat(nextSeed, catId, slot, rarity, event);
		if (rerollResult) {
			switchedFromCatId = catId;
			catId = rerollResult.catId;
			slot = rerollResult.slot;
		}
	}

	const result: RollResult = {
		rollNumber: 0, // Will be set by caller
		seed,
		rarity,
		rarityName: rarityToString(rarity),
		catId,
		slot,
		score,
		switchTracks: switchedFromCatId !== undefined,
		switchedFromCatId,
	};

	return { result, nextSeed };
}

/**
 * Simulates multiple gacha rolls
 *
 * @param initialSeed - The starting seed
 * @param event - The gacha event configuration
 * @param count - Number of rolls to simulate (default: 100)
 * @returns Array of roll results
 */
export function rollMultiple(
	initialSeed: number,
	event: GachaEvent,
	count: number = 100,
): RollResult[] {
	const results: RollResult[] = [];
	let currentSeed = initialSeed;

	let lastCatId: number | undefined;
	for (let i = 0; i < count; i++) {
		const { result, nextSeed } = rollOnce(currentSeed, event, lastCatId);
		result.rollNumber = i + 1;
		lastCatId = result.catId;
		results.push(result);
		currentSeed = advanceSeed(nextSeed);
	}

	return results;
}

/**
 * Creates a guaranteed Uber roll using the rarity seed from a given roll
 */
function createGuaranteedRoll(
	seed: number,
	event: GachaEvent,
	track: number,
	rollNumber: number,
): RollResult {
	// Guaranteed roll always gives an Uber
	const { catId, slot } = selectCat(seed, Rarity.Uber, event);
	return {
		rollNumber,
		seed,
		rarity: Rarity.Uber,
		rarityName: rarityToString(Rarity.Uber),
		catId,
		slot,
		score: 0, // Not applicable for guaranteed rolls
		track,
		isGuaranteed: true,
	};
}

interface BothTracksRoll {
	trackA: RollResult;
	trackB: RollResult;
	guaranteedA?: RollResult;
	guaranteedB?: RollResult;
}

/**
 * Simulates multiple rolls showing both Track A and Track B
 * This allows you to see what happens if you switch tracks with a guaranteed roll
 */
export function rollMultipleBothTracks(
	seed: number,
	event: GachaEvent,
	count: number = 100,
	hasGuaranteed: boolean = false,
	isStepUp: boolean = false,
): BothTracksRoll[] {
	const results: BothTracksRoll[] = [];
	const trackARolls = rollMultiple(advanceSeed(seed), event, count);
	const trackBRolls = rollMultiple(seed, event, count + 1).slice(1);

	// Second pass: calculate guaranteed rolls
	const guaranteedRolls = isStepUp ? 15 : 10;

	for (let i = 0; i < count; i++) {
		const trackA = trackARolls[i];
		const trackB = trackBRolls[i];
		const roll: BothTracksRoll = { trackA, trackB };

		if (hasGuaranteed) {
			const lastIndex = i + guaranteedRolls - 1;

			if (lastIndex < count && lastIndex > 0) {
				const seedIndex = lastIndex;

				const seedA = trackARolls[seedIndex + 1]?.seed;
				if (seedA) {
					roll.guaranteedA = createGuaranteedRoll(
						seedA,
						event,
						1, // Guaranteed appears on Track B (opposite of Track A)
						trackA.rollNumber,
					);
				}

				const seedB = trackBRolls[seedIndex + 1]?.seed;
				if (seedB) {
					roll.guaranteedB = createGuaranteedRoll(
						seedB,
						event,
						0, // Guaranteed appears on Track A (opposite of Track B)
						trackB.rollNumber,
					);
				}
			}
		}

		results.push(roll);
	}

	return results;
}
