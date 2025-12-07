/**
 * Helper functions to load and process Battle Cats gacha data
 */

import { type GachaEvent, Rarity } from "./battle-cats-gacha";

export interface CatInfo {
	name: string[];
	desc: string[];
	rarity: number;
	max_level: number;
	[key: string]: unknown;
}

export interface CatDatabase {
	cats: Record<number, CatInfo>;
	gacha: Record<string, GachaPoolData>;
	events: Record<string, EventData>;
}

export interface GachaPoolData {
	cats: number[];
	series_id?: number;
	name?: string;
	rate?: string;
	similarity?: number;
}

export interface EventData {
	id: number;
	start_on: string;
	end_on: string;
	name: string;
	rare: number;
	supa: number;
	uber: number;
	legend: number;
	guaranteed?: boolean;
	step_up: boolean;
	platinum?: "platinum" | "legend";
}

export interface EventsData {
	[eventKey: string]: EventData;
}

export interface EventOption {
	key: string;
	id: number;
	name: string;
	displayName: string;
	startDate: string;
	endDate: string;
}

/**
 * Load cat database from JSON
 */
export async function loadCatDatabase(): Promise<CatDatabase> {
	const response = await fetch("/data/bc-en.json");
	return response.json() as Promise<CatDatabase>;
}

/**
 * Create a GachaEvent from event data and cat database
 */
export function createGachaEvent(
	eventData: EventData,
	catDatabase: CatDatabase,
): GachaEvent {
	// Group cats by rarity
	const slots = Object.fromEntries(
		[
			Rarity.Normal,
			Rarity.Special,
			Rarity.Rare,
			Rarity.SuperRare,
			Rarity.Uber,
			Rarity.Legend,
		].map((r) => [r, []]),
	) as GachaEvent["slots"];

	const cats = catDatabase.gacha[eventData.id]?.cats;
	if (!cats) {
		console.warn(`No gacha pool found for event ID ${eventData.id}`);
	}
	for (const catId of cats) {
		const cat = catDatabase.cats[catId];
		if (cat && cat.rarity !== undefined) {
			const raritySlots = slots[cat.rarity as Rarity];
			if (raritySlots) {
				raritySlots.push(catId);
			}
		}
	}

	// Use rates from event data
	const rates = {
		rare: eventData.rare,
		supa: eventData.supa,
		uber: eventData.uber,
		legend: eventData.legend,
	};

	return {
		id: eventData.id,
		slots,
		rates,
		guaranteedUberRolls: eventData.step_up
			? 15
			: eventData.guaranteed
				? 10
				: undefined,
	};
}

/**
 * Get suffix for event display name based on event properties
 */
function getEventSuffix(event: EventData): string {
	if (event.platinum === "platinum") return " [Platinum]";
	if (event.platinum === "legend") return " [Legend]";
	if (event.step_up) return " [Step Up]";
	if (event.guaranteed) return " [Guaranteed]";
	return "";
}

/**
 * Get list of events for dropdown (active or future events only)
 */
export function getEventOptions(eventsData: EventsData): EventOption[] {
	const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

	const events = Object.entries(eventsData)
		.map(([key, event]) => ({ ...event, key }))
		.filter((event) => event.end_on >= today) // Only active or future events
		.sort((a, b) => a.start_on.localeCompare(b.start_on)) // Latest first
		.map((event) => ({
			key: event.key,
			id: event.id,
			name: event.name,
			platinum: event.platinum,
			displayName: `${event.start_on} - ${event.end_on}:${getEventSuffix(event)} ${event.name}`,
			startDate: event.start_on,
			endDate: event.end_on,
		}));
	// remove all but the most recent platinum/legend events
	return events.filter((event, index) => {
		if (!event.platinum) return true;
		if (events[index + 2].platinum) return false;
		return true;
	});
}
