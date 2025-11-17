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
	[key: string]: unknown;
}

export interface GachaPoolData {
	cats: number[];
	series_id?: number;
	name?: string;
	rate?: string;
	similarity?: number;
}

export interface EventData {
	key: string;
	id: number;
	startDate: string;
	endDate: string;
	name: string;
	rates: {
		rare: number;
		supa: number;
		uber: number;
		legend: number;
	};
	guaranteed: boolean;
	stepUp: boolean;
	version: string;
	cats: number[];
	seriesId?: number;
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
 * Load gacha events from JSON
 */
export async function loadGachaEvents(): Promise<EventsData> {
	const response = await fetch("/data/events.json");
	return response.json() as Promise<EventsData>;
}

/**
 * Create a GachaEvent from event data and cat database
 */
export function createGachaEvent(
	eventData: EventData,
	catDatabase: CatDatabase,
): GachaEvent {
	// Group cats by rarity
	const slots: GachaEvent["slots"] = {
		[Rarity.Normal]: [],
		[Rarity.Special]: [],
		[Rarity.Rare]: [],
		[Rarity.SuperRare]: [],
		[Rarity.Uber]: [],
		[Rarity.Legend]: [],
	};

	for (const catId of eventData.cats) {
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
		rare: eventData.rates.rare,
		supa: eventData.rates.supa,
		uber: eventData.rates.uber,
	};

	return {
		id: eventData.id,
		slots,
		rates,
	};
}

/**
 * Get list of events for dropdown (active or future events only)
 */
export function getEventOptions(eventsData: EventsData): EventOption[] {
	const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

	const events = Object.values(eventsData)
		.filter((event) => event.endDate >= today) // Only active or future events
		.sort((a, b) => b.startDate.localeCompare(a.startDate)) // Latest first
		.map((event) => ({
			key: event.key,
			id: event.id,
			name: event.name,
			displayName: `${event.startDate} - ${event.endDate}: ${event.name}`,
			startDate: event.startDate,
			endDate: event.endDate,
		}));
	return events.filter(
		(event, index) => events.findIndex((e) => e.name === event.name) === index,
	); // Remove duplicates by name
}
