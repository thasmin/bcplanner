import { describe, expect, test } from "bun:test";
import path from "node:path";
import {
	rollMultiple,
	rollMultipleBothTracks,
	rollOnce,
} from "./battle-cats-gacha";
import { type CatDatabase, createGachaEvent } from "./gacha-data";

async function loadCatDatabaseForTest(): Promise<CatDatabase> {
	const filePath = path.join(import.meta.dir, "../../public/data/bc-en.json");
	const file = Bun.file(filePath);
	return await file.json();
}

describe("Battle Cats Gacha", () => {
	test("rollOnce with seed 2428617162", async () => {
		const catDatabase = await loadCatDatabaseForTest();
		const eventData = catDatabase.events["2025-12-09_1020"];

		if (!eventData) {
			throw new Error("Event 2025-12-09_1020 not found");
		}

		const event = createGachaEvent(eventData, catDatabase);
		const seed = 2428617162;

		const { result } = rollOnce(seed, event);

		expect(result.catId).toBe(37);
	});

	test("rollMultiple with seed 2428617162", async () => {
		const catDatabase = await loadCatDatabaseForTest();
		const eventData = catDatabase.events["2025-12-09_1020"];

		if (!eventData) {
			throw new Error("Event 2025-12-09_1020 not found");
		}

		const event = createGachaEvent(eventData, catDatabase);
		const seed = 2428617162;

		const results = rollMultiple(seed, event, 3);

		expect(results[1].catId).toBe(496);
		expect(results[2].catId).toBe(48);
	});

	test("guaranteed 10 rolls with seed 2428617162 and event 2025-12-09_1020", async () => {
		const catDatabase = await loadCatDatabaseForTest();
		const eventData = catDatabase.events["2025-12-09_1020"];

		if (!eventData) {
			throw new Error("Event 2025-12-09_1020 not found");
		}

		const event = createGachaEvent(eventData, catDatabase);
		const seed = 2428617162;
		const hasGuaranteed = eventData.guaranteed === true || !!eventData.step_up;
		const isStepUp = !!eventData.step_up;

		const results = rollMultipleBothTracks(
			seed,
			event,
			13,
			hasGuaranteed,
			isStepUp,
		);

		expect(results[0].trackA.catId).toBe(412);
		expect(results[0].trackB.catId).toBe(496);
		expect(results[0].guaranteedA?.catId).toBe(549);
		expect(results[0].guaranteedB?.catId).toBe(549);
		expect(results[0].guaranteedA?.isGuaranteed).toBe(true);
		expect(results[0].guaranteedB?.isGuaranteed).toBe(true);

		expect(results[1].trackA.catId).toBe(48);
		expect(results[1].trackB.catId).toBe(48);
		expect(results[1].guaranteedA?.catId).toBe(488);
		expect(results[1].guaranteedB?.catId).toBe(549);

		expect(results[2].trackA.catId).toBe(42);
		expect(results[2].trackB.catId).toBe(51);
		expect(results[2].guaranteedA?.catId).toBe(488);
		expect(results[2].guaranteedB?.catId).toBe(488);
	});

	test("guaranteed landing position calculation", async () => {
		const catDatabase = await loadCatDatabaseForTest();
		const eventData = catDatabase.events["2025-12-09_1020"];

		if (!eventData) {
			throw new Error("Event 2025-12-09_1020 not found");
		}

		const event = createGachaEvent(eventData, catDatabase);
		const seed = 2428617162;
		const hasGuaranteed = eventData.guaranteed === true || !!eventData.step_up;
		const isStepUp = !!eventData.step_up;

		const results = rollMultipleBothTracks(
			seed,
			event,
			20,
			hasGuaranteed,
			isStepUp,
		);

		expect(results[0].trackA.catId).toBe(412);
		expect(results[0].guaranteedA?.catId).toBe(549);
		expect(results[0].nextAfterGuaranteedA).toBe("11B");

		expect(results[1].trackA.catId).toBe(48);
		expect(results[1].guaranteedA?.catId).toBe(488);
		expect(results[1].nextAfterGuaranteedA).toBe("12B");

		expect(results[7].trackA.catId).toBe(38);
		expect(results[7].guaranteedA?.catId).toBe(549);
		expect(results[7].nextAfterGuaranteedA).toBe("19A");

		expect(results[8].trackA.catId).toBe(148);
		expect(results[8].guaranteedA?.catId).toBe(489);
		expect(results[8].nextAfterGuaranteedA).toBe("20A");

		expect(results[0].trackB.catId).toBe(496);
		expect(results[0].guaranteedB?.catId).toBe(549);
		expect(results[0].nextAfterGuaranteedB).toBe("12A");

		expect(results[6].trackB.catId).toBe(39);
		expect(results[6].guaranteedB?.catId).toBe(488);
		expect(results[6].nextAfterGuaranteedB).toBe("18B");

		expect(results[7].trackB.catId).toBe(53);
		expect(results[7].guaranteedB?.catId).toBe(417);
		expect(results[7].nextAfterGuaranteedB).toBe("19B");
	});
});
