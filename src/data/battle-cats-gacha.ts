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
	/** Rarity seed used for this roll (determines the cat's rarity) */
	raritySeed: number;
	/** Slot seed used for this roll (determines which specific cat from the rarity pool) */
	slotSeed: number;
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
	const shifted = direction === "<<" ? seed << bits : seed >>> bits;
	return ((seed ^ shifted) >>> 0) % UINT32_MAX;
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
	if (score < rare) return Rarity.Rare;
	if (score < rare + supa) return Rarity.SuperRare;
	if (score < rare + supa + uber) return Rarity.Uber;
	return Rarity.Legend;
}

const RARITY_NAMES = [
	"Normal",
	"Special",
	"Rare",
	"Super Rare",
	"Uber",
	"Legend",
];

function rarityToString(rarity: Rarity): string {
	return RARITY_NAMES[rarity];
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
 *
 * @param raritySeed - The seed used to determine rarity
 * @param event - The gacha event configuration
 * @param lastCatId - The cat ID from the previous roll (for duplicate detection)
 * @returns The roll result and the slot seed (which becomes the next roll's rarity seed)
 */
export function rollOnce(
	raritySeed: number,
	event: GachaEvent,
	lastCatId?: number,
): { result: RollResult; slotSeed: number } {
	// Use rarity seed to determine the cat's rarity
	const score = raritySeed % BASE;
	const rarity = determineRarity(score, event.rates);

	// Advance to get slot seed, which determines which specific cat from that rarity
	const slotSeed = advanceSeed(raritySeed);
	let { catId, slot } = selectCat(slotSeed, rarity, event);

	// Check for duplicates and reroll if necessary
	let switchedFromCatId: number | undefined;
	if (catId === lastCatId) {
		const rerollResult = rerollCat(slotSeed, catId, slot, rarity, event);
		if (rerollResult) {
			switchedFromCatId = catId;
			catId = rerollResult.catId;
			slot = rerollResult.slot;
		}
	}

	const result: RollResult = {
		rollNumber: 0, // Will be set by caller
		raritySeed,
		slotSeed,
		rarity,
		rarityName: rarityToString(rarity),
		catId,
		slot,
		score,
		switchTracks: switchedFromCatId !== undefined,
		switchedFromCatId,
	};

	// The slot seed becomes the next roll's rarity seed
	return { result, slotSeed };
}

/**
 * Simulates multiple gacha rolls
 *
 * @param initialRaritySeed - The starting rarity seed
 * @param event - The gacha event configuration
 * @param count - Number of rolls to simulate (default: 100)
 * @returns Array of roll results
 */
export function rollMultiple(
	initialRaritySeed: number,
	event: GachaEvent,
	count: number = 100,
): RollResult[] {
	const results: RollResult[] = [];
	let raritySeed = initialRaritySeed;

	let lastCatId: number | undefined;
	for (let i = 0; i < count; i++) {
		// Roll once using the current rarity seed
		const { result, slotSeed } = rollOnce(raritySeed, event, lastCatId);
		result.rollNumber = i + 1;
		lastCatId = result.catId;
		results.push(result);

		// Advance from slot seed to get next rarity seed
		raritySeed = advanceSeed(slotSeed);
	}

	return results;
}

/**
 * Creates a guaranteed Uber roll using a rarity seed
 *
 * @param raritySeed - The seed to use for selecting the guaranteed uber
 * @param event - The gacha event configuration
 * @param track - Which track this guaranteed appears on (0 = A, 1 = B)
 * @param rollNumber - The position number for this roll
 */
function createGuaranteedRoll(
	raritySeed: number,
	event: GachaEvent,
	track: number,
	rollNumber: number,
): RollResult {
	// Guaranteed roll always gives an Uber, using the rarity seed directly as slot seed
	const { catId, slot } = selectCat(raritySeed, Rarity.Uber, event);
	return {
		rollNumber,
		raritySeed,
		slotSeed: raritySeed, // For guaranteed rolls, rarity seed is used as slot seed
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
 * Calculates guaranteed rolls for both tracks at a given position
 */
function calculateGuaranteedRolls(
	position: number,
	trackARolls: RollResult[],
	guaranteedRolls: number,
	count: number,
	event: GachaEvent,
): { guaranteedA?: RollResult; guaranteedB?: RollResult } {
	const lastRollIndex = position + guaranteedRolls - 1;

	if (lastRollIndex >= count || lastRollIndex <= 0) {
		return {};
	}

	const guaranteedSeedIndex = lastRollIndex + 1;
	const result: { guaranteedA?: RollResult; guaranteedB?: RollResult } = {};

	// Track A's guaranteed: uses Track A's rarity seed, appears on Track B
	const guaranteedRaritySeedA = trackARolls[guaranteedSeedIndex]?.raritySeed;
	if (guaranteedRaritySeedA) {
		result.guaranteedA = createGuaranteedRoll(
			guaranteedRaritySeedA,
			event,
			1, // Guaranteed appears on Track B (opposite of Track A)
			trackARolls[position].rollNumber,
		);
	}

	// Track B's guaranteed: due to offset, uses different seed pattern
	// Position 1 (i=0): uses trackARolls[guaranteedSeedIndex]
	// Position 2 (i=1): uses trackARolls[guaranteedSeedIndex - 1]
	// Position 3+ (i>=2): uses trackARolls[guaranteedSeedIndex]
	const guaranteedRaritySeedB =
		position === 1
			? trackARolls[guaranteedSeedIndex - 1]?.raritySeed
			: trackARolls[guaranteedSeedIndex]?.raritySeed;

	if (guaranteedRaritySeedB) {
		result.guaranteedB = createGuaranteedRoll(
			guaranteedRaritySeedB,
			event,
			0, // Guaranteed appears on Track A (opposite of Track B)
			trackARolls[position].rollNumber,
		);
	}

	return result;
}

/**
 * Simulates multiple rolls showing both Track A and Track B
 *
 * Track A and Track B represent two parallel timelines from the same initial seed:
 * - Track A uses the "odd" seed sequence: S1, S3, S5, S7, ...
 * - Track B uses the "even" seed sequence: S2, S4, S6, S8, ...
 *
 * This allows you to see what happens if you switch tracks with a guaranteed roll.
 *
 * @param initialSeed - The starting seed (S0)
 * @param event - The gacha event configuration
 * @param count - Number of positions to simulate
 * @param hasGuaranteed - Whether this event has guaranteed uber rolls
 * @param isStepUp - Whether this is a step-up event (15 rolls vs 10 rolls)
 */
export function rollMultipleBothTracks(
	initialSeed: number,
	event: GachaEvent,
	count: number = 100,
	hasGuaranteed: boolean = false,
	isStepUp: boolean = false,
): BothTracksRoll[] {
	const results: BothTracksRoll[] = [];

	// Track A starts with S1 (one advance from S0), uses odd sequence
	const trackARolls = rollMultiple(advanceSeed(initialSeed), event, count);

	// Track B starts with S0 but wastes first roll, effectively using even sequence
	const trackBRolls = rollMultiple(initialSeed, event, count + 1).slice(1);

	// Second pass: calculate guaranteed rolls
	const guaranteedRolls = isStepUp ? 15 : 10;

	for (let i = 0; i < count; i++) {
		const guaranteed = hasGuaranteed
			? calculateGuaranteedRolls(i, trackARolls, guaranteedRolls, count, event)
			: {};

		results.push({
			trackA: trackARolls[i],
			trackB: trackBRolls[i],
			...guaranteed,
		});
	}

	return results;
}
