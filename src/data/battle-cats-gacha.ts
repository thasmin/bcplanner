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

	const slot = (((slotValue >>> 0) % pool.length) + pool.length) % pool.length;
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
	// Step 1: Advance seed and get rarity
	const raritySeed = advanceSeed(seed) >>> 0; // Ensure unsigned
	const rarityFruitValue = raritySeed >>> 0;
	const score = ((rarityFruitValue % BASE) + BASE) % BASE; // Ensure positive modulo
	const rarity = determineRarity(score, event.rates);

	// Step 2: Advance seed again and get slot
	const slotSeed = advanceSeed(raritySeed) >>> 0; // Ensure unsigned
	const slotFruitValue = slotSeed >>> 0;
	const { catId, slot } = selectCat(slotFruitValue, rarity, event);

	return {
		result: {
			rollNumber: 0, // Will be set by rollMultiple
			seed: raritySeed,
			rarity,
			rarityName: rarityToString(rarity),
			catId,
			slot,
			score,
		},
		nextSeed: slotSeed,
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
		const { result, nextSeed } = rollOnce(currentSeed, event);
		result.rollNumber = i + 1;
		results.push(result);
		currentSeed = nextSeed;
	}

	return results;
}

/**
 * Rolls both tracks (A and B) simultaneously
 * Track A and Track B represent parallel timelines that you can switch between
 * using guaranteed rolls
 */
export function rollBoth(
	seed: number,
	event: GachaEvent,
): { trackA: RollResult; trackB: RollResult; nextSeed: number } {
	// First roll determines Track A
	const { result: trackA, nextSeed: afterA } = rollOnce(seed, event);
	trackA.track = 0;

	// Use the same initial seed to determine Track B's rarity
	// but advance from the Track A's final seed for Track B's slot
	const raritySeed = advanceSeed(seed) >>> 0;
	const score = ((raritySeed % BASE) + BASE) % BASE;
	const rarity = determineRarity(score, event.rates);

	// For track B, we use the seed after Track A completed
	const slotSeed = advanceSeed(afterA) >>> 0;
	const { catId, slot } = selectCat(slotSeed, rarity, event);

	const trackB: RollResult = {
		rollNumber: 0,
		seed: raritySeed,
		rarity,
		rarityName: rarityToString(rarity),
		catId,
		slot,
		score,
		track: 1,
	};

	return {
		trackA,
		trackB,
		nextSeed: afterA, // Continue from Track A's seed
	};
}

/**
 * Simulates multiple rolls showing both Track A and Track B
 * This allows you to see what happens if you switch tracks with a guaranteed roll
 */
export function rollMultipleBothTracks(
	initialSeed: number,
	event: GachaEvent,
	count: number = 100,
): Array<[RollResult, RollResult]> {
	const results: Array<[RollResult, RollResult]> = [];
	let currentSeed = initialSeed;

	for (let i = 0; i < count; i++) {
		const { trackA, trackB, nextSeed } = rollBoth(currentSeed, event);
		trackA.rollNumber = i + 1;
		trackB.rollNumber = i + 1;
		results.push([trackA, trackB]);
		currentSeed = nextSeed;
	}

	return results;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculates statistics from roll results
 */
export function calculateStats(results: RollResult[]): {
	total: number;
	byRarity: Record<string, number>;
	percentages: Record<string, string>;
} {
	const byRarity: Record<string, number> = {
		Rare: 0,
		"Super Rare": 0,
		Uber: 0,
		Legend: 0,
	};

	for (const result of results) {
		byRarity[result.rarityName]++;
	}

	const percentages: Record<string, string> = {};
	for (const [rarity, count] of Object.entries(byRarity)) {
		percentages[rarity] = ((count / results.length) * 100).toFixed(2) + "%";
	}

	return {
		total: results.length,
		byRarity,
		percentages,
	};
}

/**
 * Formats roll results as a readable string
 */
export function formatResults(results: RollResult[]): string {
	let output = "Roll | Seed       | Rarity      | Cat ID | Slot | Score\n";
	output += "-----+------------+-------------+--------+------+-------\n";

	for (const result of results) {
		output += `${result.rollNumber.toString().padStart(4)} | `;
		output += `${result.seed.toString().padStart(10)} | `;
		output += `${result.rarityName.padEnd(11)} | `;
		output += `${result.catId.toString().padStart(6)} | `;
		output += `${result.slot.toString().padStart(4)} | `;
		output += `${result.score.toString().padStart(5)}\n`;
	}

	return output;
}

// ============================================================================
// Example Usage (for Node.js only)
// ============================================================================

// The following code is for testing in Node.js environments only
// It will not run in the browser
/*
if (require.main === module) {
	// Example event configuration (based on a typical Uberfest event)
	const exampleEvent: GachaEvent = {
		id: "uberfest_example",
		rates: {
			rare: 6500, // 65%
			supa: 2600, // 26%
			uber: 900, // 9%
			// legend: 0% (10000 - 6500 - 2600 - 900 = 0)
		},
		slots: {
			[Rarity.Rare]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
			[Rarity.SuperRare]: [11, 12, 13, 14, 15],
			[Rarity.Uber]: [100, 101, 102, 103, 104, 105],
			[Rarity.Legend]: [200],
		},
	};

	const seed = 123456789;
	const results = rollMultiple(seed, exampleEvent, 100);

	console.log("Battle Cats Gacha Roll Simulation");
	console.log("==================================\n");
	console.log(`Initial Seed: ${seed}`);
	console.log(`Event: ${exampleEvent.id}`);
	console.log(`Rolls: ${results.length}\n`);

	// Show first 10 rolls
	console.log("First 10 rolls:");
	console.log(formatResults(results.slice(0, 10)));

	// Show statistics
	console.log("\nStatistics:");
	const stats = calculateStats(results);
	console.log(`Total rolls: ${stats.total}`);
	console.log("\nRarity distribution:");
	for (const [rarity, count] of Object.entries(stats.byRarity)) {
		console.log(
			`  ${rarity.padEnd(11)}: ${count.toString().padStart(3)} (${stats.percentages[rarity]})`,
		);
	}

	// Find all Uber and Legend rolls
	const specialRolls = results.filter(
		(r) => r.rarity === Rarity.Uber || r.rarity === Rarity.Legend,
	);

	console.log(`\nSpecial rolls (Uber/Legend): ${specialRolls.length}`);
	if (specialRolls.length > 0) {
		console.log("\nAll Uber and Legend rolls:");
		console.log(formatResults(specialRolls));
	}
}
*/
