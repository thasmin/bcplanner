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
	guaranteedUberRolls?: number;
}

// ============================================================================
// XORShift32 Random Number Generator
// ============================================================================

export const UINT32_MAX = 0x100000000;

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
export function xorShift(seed: number, direction: "<<" | ">>", bits: number): number {
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

export const BASE = 10000;

/**
 * Determines rarity based on score and event rates
 */
export function determineRarity(score: number, rates: GachaEvent["rates"]): Rarity {
	const { rare, supa, uber } = rates;
	if (score < rare) return Rarity.Rare;
	if (score < rare + supa) return Rarity.SuperRare;
	if (score < rare + supa + uber) return Rarity.Uber;
	return Rarity.Legend;
}

function rerollCat(
	slotSeed: number,
	originalCatId: number,
	originalSlot: number,
	rarity: Rarity,
	event: GachaEvent,
): { catId: number; slot: number; steps: number; seed: number } {
	const originalPool = event.slots[rarity] || [];
	const rerollingSlots = [...originalPool];

	let currentSeed = slotSeed;
	let slot = originalSlot;
	const duplicateCount = originalPool.filter(
		(id) => id === originalCatId,
	).length;

	for (let steps = 1; steps <= duplicateCount; steps++) {
		currentSeed = advanceSeed(currentSeed);
		rerollingSlots.splice(slot, 1);
		slot = currentSeed % rerollingSlots.length;
		const newCatId = rerollingSlots[slot];
		if (newCatId !== originalCatId)
			return { catId: newCatId, slot, steps, seed: currentSeed };
	}

	throw new Error("Reroll failed to find a different cat");
}

// ============================================================================
// Main Gacha Roll Function
// ============================================================================

export function createCat(event: GachaEvent, raritySeed: number, slotSeed: number) {
	const score = raritySeed % BASE;
	const rarity = determineRarity(score, event.rates);
	const pool = event.slots[rarity];
	if (!pool || pool.length === 0) return -1;
	const slot = slotSeed % pool.length;
	return pool[slot];
}

function createUberCat(event: GachaEvent, slotSeed: number) {
	const pool = event.slots[Rarity.Uber];
	if (!pool || pool.length === 0) return -1;
	const slot = slotSeed % pool.length;
	return pool[slot];
}

export interface TrackRolls {
	score: number;
	nextSeed: number;
	catId: number;
	switchedFromCatId?: number;
	guaranteedUberId?: number;
	nextAfterGuaranteed?: string;
}

function otherTrack(track: "A" | "B"): "A" | "B" {
	return track === "A" ? "B" : "A";
}

export function rollTrack(
	event: GachaEvent,
	initialSeed: number,
	count: number,
	track: "A" | "B",
) {
	const seeds = [advanceSeed(initialSeed)];
	while (seeds.length < (count + (event.guaranteedUberRolls ?? 0)) * 2)
		seeds.push(advanceSeed(seeds.at(-1) ?? -1));

	const rolls: TrackRolls[] = [];
	const rerolled = new Map<number, number>();
	for (let i = 0; i < count; i++) {
		const ndx = i * 2;
		let catId = createCat(event, seeds[ndx], seeds[ndx + 1]);
		let switchedFromCatId: number | undefined;
		if (catId === rolls.at(-1)?.catId) {
			const score = seeds[ndx] % BASE;
			const rarity = determineRarity(score, event.rates);
			if (rarity === Rarity.Rare) {
				const pool = event.slots[rarity] || [];
				const slot = seeds[ndx + 1] % pool.length;
				const rerolledCat = rerollCat(
					seeds[ndx + 1],
					catId,
					slot,
					rarity,
					event,
				);
				if (rerolledCat) {
					switchedFromCatId = catId;
					catId = rerolledCat.catId;
					rerolled.set(i, rerolledCat.seed);
				}
			}
		}
		rolls.push({
			score: seeds[ndx] % BASE,
			nextSeed: seeds[ndx + 1],
			catId,
			switchedFromCatId,
		});
	}

	if (event.guaranteedUberRolls) {
		for (let i = 0; i < count; i++) {
			// go forward 10 rolls accounting for switches
			let switches = 0;
			let seedIndex = i * 2;
			// If this position had a reroll, start from the next seed
			if (rerolled.has(i)) {
				seedIndex += 1;
				switches += 1;
			}
			let lastCatId = createCat(event, seeds[seedIndex], seeds[seedIndex + 1]);
			for (let j = 0; j < event.guaranteedUberRolls; j++) {
				seedIndex += 2;
				const nextCatId = createCat(
					event,
					seeds[seedIndex],
					seeds[seedIndex + 1],
				);
				if (lastCatId === nextCatId) {
					seedIndex += 1;
					switches += 1;
				}
				lastCatId = nextCatId;
			}
			rolls[i].guaranteedUberId = createUberCat(event, seeds[seedIndex]);
			rolls[i].nextAfterGuaranteed =
				`${i + Math.ceil((event.guaranteedUberRolls * 2 + switches) / 2) + 1}${
					switches % 2 === 0 ? otherTrack(track) : track
				}`;
		}
	}
	return rolls;
}

export function rollTracks(event: GachaEvent, seed: number, count: number) {
	return {
		trackA: rollTrack(event, seed, count, "A"),
		trackB: rollTrack(event, advanceSeed(seed), count, "B"),
	};
}
