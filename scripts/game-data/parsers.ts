/**
 * Parsers for Battle Cats CSV/TSV game data files
 */

import type {
	CatData,
	CatStat,
	EventData,
	GachaPoolData,
	ParsedEvent,
	ParsedEventPool,
	TalentData,
	UnitBuyData,
} from "./types";

/**
 * Parse GatyaDataSetR1.csv to extract gacha pool definitions
 * Each line contains comma-separated cat IDs, terminated with -1
 * Line index = gacha pool ID
 */
export function parseGachaData(
	csv: string,
	preservedGacha?: Record<number, GachaPoolData>,
): Record<number, GachaPoolData> {
	const result: Record<number, GachaPoolData> = {};

	csv.split("\n").forEach((line, index) => {
		const trimmed = line.trim();
		if (/^\d+/.test(trimmed)) {
			const slots = trimmed.split(",");
			// Remove trailing -1 terminator
			while (slots.length > 0 && !slots[slots.length - 1].startsWith("-1")) {
				slots.pop();
			}
			if (slots.length > 0) {
				slots.pop(); // Remove the -1 itself
			}
			// Convert to cat IDs (add 1 to convert from 0-indexed to 1-indexed)
			const cats = slots
				.filter((s) => s.trim() !== "")
				.map((s) => Number.parseInt(s, 10) + 1);
			if (cats.length > 0) {
				result[index] = { cats };
			}
		} else if (preservedGacha?.[index]) {
			// Use preserved gacha data for empty lines
			result[index] = preservedGacha[index];
		}
	});

	return result;
}

/**
 * Parse GatyaData_Option_SetR.tsv to get gacha series IDs
 */
export function parseGachaOption(tsv: string): Record<number, { series_id: number }> {
	const result: Record<number, { series_id: number }> = {};

	tsv
		.split("\n")
		.slice(1) // Skip header
		.forEach((line) => {
			const fields = line.split("\t");
			if (fields.length > 5) {
				const id = Number.parseInt(fields[0], 10);
				const series_id = Number.parseInt(fields[5], 10);
				if (!Number.isNaN(id) && !Number.isNaN(series_id)) {
					result[id] = { series_id };
				}
			}
		});

	return result;
}

/**
 * Parse unitbuy.csv to get rarity and max level for each cat
 */
export function parseUnitBuy(csv: string): Record<number, UnitBuyData> {
	const result: Record<number, UnitBuyData> = {};

	csv.split("\n").forEach((line, index) => {
		const id = index + 1;
		const row = line.split(",");
		if (row.length > 51) {
			result[id] = {
				rarity: Number.parseInt(row[13], 10),
				max_level: Number.parseInt(row[50], 10) + Number.parseInt(row[51], 10),
			};
		}
	});

	return result;
}

/**
 * Parse unitlevel.csv to get growth data for each cat
 */
export function parseUnitLevel(csv: string): Record<number, number[]> {
	const result: Record<number, number[]> = {};

	csv.split("\n").forEach((line, index) => {
		const id = index + 1;
		const row = line.split(",");
		if (row.length > 0 && row[0] !== "") {
			result[id] = row.map((v) => Number.parseInt(v, 10) || 0);
		}
	});

	return result;
}

/**
 * Parse nyankoPictureBookData.csv to get unit form count
 */
export function parseUnitForms(csv: string): Record<number, number> {
	const result: Record<number, number> = {};

	csv.split("\n").forEach((line, index) => {
		const id = index + 1;
		const row = line.split(",");
		if (row.length > 2) {
			result[id] = Number.parseInt(row[2], 10);
		}
	});

	return result;
}

/**
 * Parse Unit_Explanation CSV files for cat names and descriptions
 * Format: Name|Desc part 1|Desc part 2||
 * Returns { id, names, descriptions }
 */
export function parseUnitExplanation(
	filename: string,
	csv: string,
): { id: number; names: string[]; descs: string[] } | null {
	const idMatch = filename.match(/\d+/);
	if (!idMatch) return null;

	const id = Number.parseInt(idMatch[0], 10);

	// Detect separator - Japanese uses comma, others use pipe
	const isJapanese = filename.endsWith("_ja.csv");
	const separator = isJapanese ? "," : "|";

	// Helper to strip whitespace including unicode whitespace
	const strip = (str: string) => str.replace(/^\s+|\s+$/g, "");

	const names: string[] = [];
	const descs: string[] = [];

	for (const line of csv.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		const parts = trimmed.split(separator);
		if (parts.length === 0) continue;

		// First field is the name
		const name = strip(parts[0]);
		if (!name) continue;

		names.push(name);

		// Remaining fields (excluding trailing empty ones) form the description
		const descParts = parts.slice(1).map(strip).filter((p) => p !== "");
		const desc = descParts.join("\n");
		descs.push(desc);
	}

	if (names.length === 0 && descs.length === 0) {
		return null;
	}

	// Provide placeholder name if missing
	if (names.length === 0 && descs.length > 0) {
		names.push(`(${id}?)`);
	}

	return { id, names, descs };
}

// Stat field indices matching the Ruby code
const STAT_FIELDS: Record<string, number> = {
	health: 0,
	knockbacks: 1,
	speed: 2,
	cost: 6,
	production_cooldown: 7,
	attack_cooldown: 4,
	range: 5,
	width: 9,
	area_effect: 12,
	damage_0: 3,
	long_range_0: 44,
	long_range_offset_0: 45,
	attack_time_0: 13,
	trigger_effects_0: 63,
	damage_1: 59,
	long_range_1: 100,
	long_range_offset_1: 101,
	attack_time_1: 61,
	trigger_effects_1: 64,
	damage_2: 60,
	long_range_2: 103,
	long_range_offset_2: 104,
	attack_time_2: 62,
	trigger_effects_2: 65,
	against_red: 10,
	against_float: 16,
	against_black: 17,
	against_angel: 20,
	against_alien: 21,
	against_zombie: 22,
	against_aku: 96,
	against_relic: 78,
	against_white: 19,
	against_metal: 18,
	against_only: 32,
	strong: 23,
	massive_damage: 30,
	insane_damage: 81,
	resistant: 29,
	insane_resistant: 80,
	knockback_chance: 24,
	freeze_chance: 25,
	freeze_duration: 26,
	slow_chance: 27,
	slow_duration: 28,
	weaken_chance: 37,
	weaken_duration: 38,
	weaken_multiplier: 39,
	curse_chance: 92,
	curse_duration: 93,
	dodge_chance: 84,
	dodge_duration: 85,
	survive_chance: 42,
	strengthen_threshold: 40,
	strengthen_modifier: 41,
	savage_blow_chance: 82,
	savage_blow_modifier: 83,
	critical_chance: 31,
	metal_killer: 112,
	break_barrier_chance: 70,
	break_shield_chance: 95,
	zombie_killer: 52,
	soul_strike: 98,
	base_destroyer: 34,
	colossus_slayer: 97,
	sage_slayer: 111,
	witch_slayer: 53,
	eva_angel_slayer: 77,
	behemoth_slayer: 105,
	behemoth_dodge_chance: 106,
	behemoth_dodge_duration: 107,
	conjure: 110,
	wave_chance: 35,
	wave_level: 36,
	wave_mini: 94,
	surge_chance: 86,
	surge_level: 89,
	surge_mini: 108,
	surge_range: 87,
	surge_range_offset: 88,
	counter_surge: 109,
	explosion_chance: 113,
	explosion_range: 114,
	extra_money: 33,
	metallic: 43,
	kamikaze: 58,
	immune_bosswave: 56,
	immune_knockback: 48,
	immune_warp: 75,
	immune_freeze: 49,
	immune_slow: 50,
	immune_weaken: 51,
	immune_curse: 79,
	immune_wave: 46,
	block_wave: 47,
	immune_surge: 91,
	immune_explosion: 116,
	immune_toxic: 90,
};

/**
 * Parse a unit CSV file (unit001.csv, etc.) for cat stats
 */
export function parseUnitStats(csv: string): CatStat[] {
	const stats: CatStat[] = [];

	for (const line of csv.split("\n")) {
		const values = line.split(",");
		if (values.length === 0 || values[0] === "") continue;

		const stat: CatStat = {} as CatStat;

		for (const [field, index] of Object.entries(STAT_FIELDS)) {
			const value = values[index];
			if (value !== undefined) {
				const parsed = Number.parseInt(value, 10);
				// Only include if it's a valid number and not zero (except for required fields)
				if (
					!Number.isNaN(parsed) &&
					(parsed !== 0 ||
						["health", "knockbacks", "speed", "cost", "range", "width"].includes(
							field,
						))
				) {
					(stat as Record<string, number>)[field] = parsed;
				}
			}
		}

		// Handle conjure offset
		if (stat.conjure !== undefined) {
			stat.conjure += 1;
			if (stat.conjure === 0) {
				delete stat.conjure;
			}
		}

		// Handle wave/surge mini rename
		for (const type of ["wave", "surge"]) {
			const mini = `${type}_mini` as keyof CatStat;
			const chance = `${type}_chance` as keyof CatStat;
			if (stat[mini]) {
				(stat as Record<string, number>)[mini] = stat[chance] as number;
				delete stat[chance];
			}
		}

		if (Object.keys(stat).length > 0) {
			stats.push(stat);
		}
	}

	return stats;
}

// Talent type mapping
const TALENT_TYPES: Record<number, string> = {
	32: "increase_health",
	31: "increase_damage",
	27: "increase_speed",
	25: "reduce_cost",
	26: "reduce_production_cooldown",
	61: "reduce_attack_cooldown",
	33: "against_red",
	34: "against_float",
	35: "against_black",
	37: "against_angel",
	38: "against_alien",
	39: "against_zombie",
	57: "against_aku",
	40: "against_relic",
	41: "against_white",
	36: "against_metal",
	4: "against_only",
	5: "strong",
	7: "massive_damage",
	6: "resistant",
	8: "knockback",
	2: "freeze",
	3: "slow",
	1: "weaken",
	60: "curse",
	51: "dodge",
	11: "survive",
	10: "strengthen",
	50: "savage_blow",
	13: "critical_strike",
	15: "break_barrier",
	58: "break_shield",
	14: "zombie_killer",
	59: "soul_strike",
	12: "base_destroyer",
	63: "colossus_slayer",
	66: "sage_slayer",
	64: "behemoth_slayer",
	17: "wave",
	62: "wave_mini",
	56: "surge",
	65: "surge_mini",
	67: "explosion",
	16: "extra_money",
	47: "immune_knockback",
	49: "immune_warp",
	45: "immune_freeze",
	46: "immune_slow",
	44: "immune_weaken",
	29: "immune_curse",
	48: "immune_wave",
	55: "immune_surge",
	53: "immune_toxic",
	21: "resistant_knockback",
	19: "resistant_freeze",
	20: "resistant_slow",
	18: "resistant_weaken",
	30: "resistant_curse",
	22: "resistant_wave",
	54: "resistant_surge",
	52: "resistant_toxic",
};

const TALENT_AGAINST = [
	"red",
	"float",
	"black",
	"metal",
	"angel",
	"alien",
	"zombie",
	"relic",
	"white",
	"eva",
	"witch",
	"aku",
];

/**
 * Parse SkillAcquisition.csv for talent data
 */
export function parseSkillAcquisition(
	csv: string,
): Record<number, { talent_against?: string[]; talent?: Record<string, TalentData> }> {
	const lines = csv.split("\n");
	if (lines.length < 2) return {};

	const headerLine = lines[0];
	const headers = headerLine.split(",");

	const result: Record<
		number,
		{ talent_against?: string[]; talent?: Record<string, TalentData> }
	> = {};

	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(",");
		if (values.length < headers.length) continue;

		const namedData: Record<string, number> = {};
		for (let j = 0; j < headers.length; j++) {
			namedData[headers[j].trim()] = Number.parseInt(values[j], 10) || 0;
		}

		const catId = namedData.ID + 1; // Convert to 1-indexed

		// Parse talent_against (type bitmask)
		const typeBits = namedData.typeID || 0;
		const talentAgainst = TALENT_AGAINST.filter(
			(_, index) => (typeBits & (1 << index)) > 0,
		);

		// Parse talents (A through H)
		const talents: Record<string, TalentData> = {};

		for (const letter of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
			const abilityId = namedData[`abilityID_${letter}`];
			if (!abilityId || !TALENT_TYPES[abilityId]) continue;

			const talentName = TALENT_TYPES[abilityId];
			const maxLevel = namedData[`MAXLv_${letter}`];
			const limit = namedData[`limit_${letter}`];

			// Collect min/max pairs
			const minmax: number[][] = [];
			for (let n = 1; n <= 4; n++) {
				const min = namedData[`min_${letter}${n}`];
				const max = namedData[`max_${letter}${n}`];
				if (min !== 0 || max !== 0) {
					minmax.push([min, max]);
				}
			}

			const talentData: TalentData = {};
			if (maxLevel && maxLevel > 1) talentData.max_level = maxLevel;
			if (minmax.length > 0) talentData.minmax = minmax;
			if (limit && limit > 0) talentData.ultra = limit;

			talents[talentName] = talentData;
		}

		const catData: { talent_against?: string[]; talent?: Record<string, TalentData> } =
			{};
		if (talentAgainst.length > 0) catData.talent_against = talentAgainst;
		if (Object.keys(talents).length > 0) catData.talent = talents;

		if (Object.keys(catData).length > 0) {
			result[catId] = catData;
		}
	}

	return result;
}

// Event TSV parsing constants
const POOL_OFFSET = 9;
const POOL_FIELDS = 15;

/**
 * Parse event TSV files (gatya.tsv from game server or saved event files)
 */
export function parseEventTsv(tsv: string): Record<string, EventData> {
	const result: Record<string, EventData> = {};

	for (const line of tsv.split("\n")) {
		// Skip [start] and [end] markers
		if (line.startsWith("[")) continue;

		const fields = line.split("\t");
		if (fields.length < POOL_OFFSET + 1) continue;

		const type = Number.parseInt(fields[8], 10);
		if (type !== 1) continue; // Only rare gacha (type 1)

		const offset = Number.parseInt(fields[POOL_OFFSET], 10);
		if (offset < 1) continue;

		// Extract pool data
		const poolFields = fields.slice(POOL_OFFSET + 1);
		const pools: ParsedEventPool[] = [];

		for (let i = 0; i < poolFields.length; i += POOL_FIELDS) {
			const poolSlice = poolFields.slice(i, i + POOL_FIELDS);
			if (poolSlice.length === POOL_FIELDS) {
				const id = Number.parseInt(poolSlice[0], 10);
				const stepUpBits = Number.parseInt(poolSlice[3], 10);
				pools.push({
					id,
					step_up: (stepUpBits & 4) === 4,
					rare: Number.parseInt(poolSlice[6], 10),
					supa: Number.parseInt(poolSlice[8], 10),
					uber: Number.parseInt(poolSlice[10], 10),
					guaranteed: Number.parseInt(poolSlice[11], 10) > 0,
					legend: Number.parseInt(poolSlice[12], 10),
					name: poolSlice[14]?.trim() || "",
				});
			}
		}

		const pool = pools[offset - 1];
		if (!pool || pool.id <= 0) continue;

		const startOn = fields[0];
		const endOn = fields[2];
		const version = fields[4];

		const eventData: EventData = {
			start_on: formatDate(startOn),
			end_on: formatDate(endOn),
			version,
			name: pool.name,
			id: pool.id,
			rare: pool.rare,
			supa: pool.supa,
			uber: pool.uber,
		};

		if (pool.legend > 0) {
			eventData.legend = pool.legend;
		}

		if (pool.step_up) {
			eventData.step_up = true;
		}

		if (pool.guaranteed) {
			eventData.guaranteed = true;
		}

		// Determine if platinum
		const BASE = 10000;
		if (pool.uber === BASE) {
			eventData.platinum = "platinum";
		} else if (pool.uber + pool.legend === BASE) {
			// Check if long-running (legend gacha) vs short (dl-100m)
			const start = new Date(formatDate(startOn));
			const end = new Date(formatDate(endOn));
			const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
			eventData.platinum = days >= 365 ? "legend" : "dl-100m";
		}

		const key = `${eventData.start_on}_${pool.id}`;
		result[key] = eventData;
	}

	return result;
}

/**
 * Format date from YYYYMMDD to YYYY-MM-DD
 */
function formatDate(dateStr: string): string {
	if (dateStr.length === 8) {
		return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
	}
	return dateStr;
}

// Predefined rate types for matching
const PREDEFINED_RATES: Record<string, { name: string; rate?: number[] }> = {
	regular: { name: "Regular", rate: [6970, 2500, 500] },
	no_legend: { name: "Regular without legend", rate: [7000, 2500, 500] },
	uberfest_legend: {
		name: "Uberfest / Epicfest with legend",
		rate: [6470, 2600, 900],
	},
	uberfest: { name: "Uberfest / Epicfest without legend", rate: [6500, 2600, 900] },
	dynastyfest: { name: "Dynasty Fest", rate: [6770, 2500, 700] },
	royalfest: { name: "Royal Fest", rate: [6940, 2500, 500] },
	superfest: { name: "Superfest", rate: [6500, 2500, 1000] },
	platinum: { name: "Platinum", rate: [0, 0, 10000] },
	legend: { name: "Legend", rate: [0, 0, 9500] },
};

/**
 * Find the rate type for an event based on its rates
 */
export function findGachaRate(
	rare: number,
	supa: number,
	uber: number,
): string | undefined {
	for (const [key, { rate }] of Object.entries(PREDEFINED_RATES)) {
		if (rate && rate[0] === rare && rate[1] === supa && rate[2] === uber) {
			return key;
		}
	}
	return undefined;
}

/**
 * Calculate Jaccard similarity between two cat arrays
 */
function calculateSimilarity(cats1: number[], cats2: number[]): number {
	const set1 = new Set(cats1);
	const set2 = new Set(cats2);
	const intersection = Array.from(set1).filter((x) => set2.has(x)).length;
	const union = new Set(cats1.concat(cats2)).size;
	return union > 0 ? Math.round((intersection / union) * 100) : 0;
}

/**
 * Match gacha pools to events and attach metadata
 */
export function matchGachaToEvents(
	gacha: Record<number, GachaPoolData>,
	gachaOption: Record<number, { series_id: number }>,
	events: Record<string, EventData>,
): Record<number, GachaPoolData> {
	// Attach series IDs first
	for (const [id, data] of Object.entries(gacha)) {
		const numId = Number(id);
		if (gachaOption[numId]) {
			data.series_id = gachaOption[numId].series_id;
		}
	}

	const eventsList = Object.values(events);

	// Match each gacha to an event
	for (const [id, gachaData] of Object.entries(gacha)) {
		const numId = Number(id);

		// Try exact match first
		const exactMatch = eventsList.find((e) => e.id === numId);
		if (exactMatch) {
			gachaData.name = exactMatch.name;
			gachaData.rate = findGachaRate(exactMatch.rare, exactMatch.supa, exactMatch.uber);
			continue;
		}

		// Find most similar event
		let bestMatch: { event: EventData; similarity: number } | null = null;

		// First try events with same series_id
		const sameSeriesEvents = eventsList.filter((e) => {
			const eventGacha = gacha[e.id];
			return eventGacha?.series_id === gachaData.series_id;
		});

		for (const event of sameSeriesEvents.length > 0 ? sameSeriesEvents : eventsList) {
			const eventCats = gacha[event.id]?.cats;
			if (!eventCats) continue;

			const similarity = calculateSimilarity(gachaData.cats, eventCats);
			if (similarity === 100) {
				// Perfect match
				gachaData.name = event.name;
				gachaData.rate = findGachaRate(event.rare, event.supa, event.uber);
				bestMatch = null;
				break;
			}
			if (!bestMatch || similarity > bestMatch.similarity) {
				bestMatch = { event, similarity };
			}
		}

		if (bestMatch && bestMatch.similarity > 0) {
			gachaData.name = bestMatch.event.name;
			gachaData.rate = findGachaRate(
				bestMatch.event.rare,
				bestMatch.event.supa,
				bestMatch.event.uber,
			);
			gachaData.similarity = bestMatch.similarity;
		}
	}

	return gacha;
}
