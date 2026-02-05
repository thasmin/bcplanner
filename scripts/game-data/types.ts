/**
 * Type definitions for Battle Cats game data
 */

export interface CatStat {
	health: number;
	knockbacks: number;
	speed: number;
	cost: number;
	production_cooldown: number;
	attack_cooldown?: number;
	range: number;
	width: number;
	area_effect?: number;
	damage_0: number;
	attack_time_0: number;
	trigger_effects_0?: number;
	damage_1?: number;
	attack_time_1?: number;
	trigger_effects_1?: number;
	damage_2?: number;
	attack_time_2?: number;
	trigger_effects_2?: number;
	attack_duration?: number;
	[key: string]: number | undefined;
}

export interface TalentData {
	max_level?: number;
	minmax?: number[][];
	ultra?: number;
}

export interface CatData {
	name: string[];
	desc: string[];
	stat: CatStat[];
	rarity: number;
	max_level: number;
	growth: number[];
	talent_against?: string[];
	talent?: Record<string, TalentData>;
}

export interface GachaPoolData {
	cats: number[];
	series_id?: number;
	name?: string;
	rate?: string;
	similarity?: number;
}

export interface EventData {
	start_on: string;
	end_on: string;
	version?: string;
	name: string;
	id: number;
	rare: number;
	supa: number;
	uber: number;
	legend?: number;
	guaranteed?: boolean;
	step_up?: boolean;
	platinum?: string;
}

export interface CatDatabase {
	cats: Record<number, CatData>;
	gacha: Record<number, GachaPoolData>;
	events: Record<string, EventData>;
}

// Intermediate types for building

export interface UnitBuyData {
	rarity: number;
	max_level: number;
}

export interface ParsedEvent {
	start_on: string;
	end_on: string;
	version: string;
	type: number;
	offset: number;
	pools: ParsedEventPool[];
}

export interface ParsedEventPool {
	id: number;
	step_up: boolean;
	rare: number;
	supa: number;
	uber: number;
	guaranteed: boolean;
	legend: number;
	name: string;
}
