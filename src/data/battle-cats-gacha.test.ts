import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { rollTracks } from "./battle-cats-gacha";
import {
	type CatDatabase,
	createGachaEvent,
	getEventOptions,
} from "./gacha-data";

async function loadCatDatabaseForTest(): Promise<CatDatabase> {
	const fileUrl = new URL("../../public/data/bc-en.json", import.meta.url);
	return JSON.parse(await readFile(fileUrl, "utf8")) as CatDatabase;
}

describe("Battle Cats Gacha", () => {
	test("excludes events without a gacha pool", () => {
		const event = {
			id: 1081,
			start_on: "2026-09-18",
			end_on: "9999-12-31",
			name: "Unavailable event",
			rare: 7000,
			supa: 2500,
			uber: 500,
			legend: 0,
			step_up: false,
		};

		expect(getEventOptions({ "2026-09-18_1081": event }, {})).toEqual([]);
		expect(
			getEventOptions({ "2026-09-18_1081": event }, { 1081: { cats: [1] } }),
		).toHaveLength(1);
	});

	test("rollTracks", async () => {
		const catDatabase = await loadCatDatabaseForTest();
		const eventData = {
			id: 1020,
			start_on: "2025-12-09",
			end_on: "2025-12-22",
			name: "EVANGELION 2nd Strike Collab Capsules",
			rare: 6970,
			supa: 2500,
			uber: 500,
			legend: 30,
			guaranteed: true,
			step_up: false,
		};

		const event = createGachaEvent(eventData, catDatabase);
		const seed = 2428617162;

		const { trackA, trackB } = rollTracks(event, seed, 20);

		expect(trackA[0].catId).toBe(412);
		expect(trackA[0].guaranteedUberId).toBe(549);
		expect(trackA[1].catId).toBe(48);
		expect(trackA[1].guaranteedUberId).toBe(488);
		expect(trackA[2].catId).toBe(42);

		expect(trackB[0].catId).toBe(496);
		expect(trackB[1].catId).toBe(48);
		expect(trackB[2].catId).toBe(51);

		// detect switch on track A
		expect(trackA[7].catId).toBe(38);
		expect(trackA[7].guaranteedUberId).toBe(549);
		expect(trackA[7].nextAfterGuaranteed).toBe("19A");
		expect(trackA[15].catId).toBe(147);
		expect(trackA[15].guaranteedUberId).toBe(415);
		expect(trackA[15].nextAfterGuaranteed).toBe("27A");
		expect(trackA[16].catId).toBe(377);
		expect(trackA[16].guaranteedUberId).toBe(488);
		expect(trackA[16].nextAfterGuaranteed).toBe("28A");

		// detect switch on track B
		expect(trackB[7].catId).toBe(53);
		expect(trackB[7].guaranteedUberId).toBe(417);
		expect(trackB[7].nextAfterGuaranteed).toBe("19B");
		expect(trackB[14].catId).toBe(53);
		expect(trackB[14].guaranteedUberId).toBe(489);
		expect(trackB[14].nextAfterGuaranteed).toBe("26B");
		expect(trackB[15].catId).toBe(57);
		expect(trackB[15].guaranteedUberId).toBe(711);
		expect(trackB[15].nextAfterGuaranteed).toBe("27B");
	});
});
