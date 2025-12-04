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
	return seed >>> 0; // Ensure unsigned
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

// ============================================================================
// Main Gacha Roll Function
// ============================================================================

/**
 * Simulates a single gacha roll
 */
export function rollOnce(
	seed: number,
	event: GachaEvent,
): { result: RollResult; nextSeed: number } {
	const score = seed % BASE;
	const rarity = determineRarity(score, event.rates);
	const nextSeed = advanceSeed(seed);
	const { catId, slot } = selectCat(nextSeed, rarity, event);
	return {
		result: {
			rollNumber: 0, // Will be set by caller
			seed,
			rarity,
			rarityName: rarityToString(rarity),
			catId,
			slot,
			score,
		},
		nextSeed,
	};
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

	for (let i = 0; i < count; i++) {
		let { result, nextSeed } = rollOnce(currentSeed, event);
		result.rollNumber = i + 1;
		// detect track switches
		const prev = results.at(-1);
		if (
			prev &&
			result.rarity === Rarity.Rare &&
			prev.rarity === Rarity.Rare &&
			result.catId === prev.catId
		) {
			console.log("detected track switch on roll", i + 1, prev, result);
			const switchedResult = rollOnce(advanceSeed(currentSeed), event);
			result = switchedResult.result;
			result.rollNumber = i + 1;
			result.switchTracks = true;
			result.switchedFromCatId = prev.catId;
			nextSeed = switchedResult.nextSeed;
		}
		results.push(result);
		currentSeed = advanceSeed(nextSeed);
	}

	return results;
}

/**
 * Rolls both tracks (A and B) simultaneously
 */
export function rollBoth(
	seed: number,
	event: GachaEvent,
): {
	trackA: RollResult;
	trackB: RollResult;
	nextSeed: number;
} {
	const nextSeed = advanceSeed(seed);
	const { result: trackB, nextSeed: seedPlusTwo } = rollOnce(nextSeed, event);
	const { result: trackC } = rollOnce(seedPlusTwo, event);
	return {
		trackA: trackB,
		trackB: trackC,
		nextSeed: seedPlusTwo, // S2
	};
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

export interface BothTracksRoll {
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
	const trackBRolls = rollMultiple(seed, event, count);

	// Second pass: calculate guaranteed rolls
	const guaranteedRolls = isStepUp ? 15 : 10;

	for (let i = 0; i < count; i++) {
		const trackA = trackARolls[i];
		const trackB = trackBRolls[i];
		const roll: BothTracksRoll = { trackA, trackB };

		if (hasGuaranteed) {
			// Follow the track for guaranteed_rolls - 1 steps
			const lastIndex = i + guaranteedRolls - 1;

			if (lastIndex < count && lastIndex > 0) {
				// Ruby: guaranteed switches to the opposite track
				// So Track A's guaranteed uses Track B's seed, and vice versa
				// Use the seed from one roll before the last (lastIndex - 1)
				const seedIndex = lastIndex;
				const seedA = trackARolls[seedIndex + 1]?.seed;
				const seedB = trackBRolls[seedIndex + 2]?.seed;
				// Swap the tracks: Track A uses Track B's seed
				if (seedA) {
					roll.guaranteedA = createGuaranteedRoll(
						seedA,
						event,
						0,
						trackA.rollNumber,
					);
				}

				if (seedB)
					roll.guaranteedB = createGuaranteedRoll(
						seedB,
						event,
						1,
						trackB.rollNumber,
					);
			}
		}

		results.push(roll);
	}

	return results;
}
