import { describe, expect, test } from "bun:test";
import path from "node:path";
import { rollTracks } from "./battle-cats-gacha";
import { type CatDatabase, createGachaEvent } from "./gacha-data";

async function loadCatDatabaseForTest(): Promise<CatDatabase> {
	const filePath = path.join(import.meta.dir, "../../public/data/bc-en.json");
	const file = Bun.file(filePath);
	return await file.json();
}

describe("Battle Cats Gacha", () => {
	test("rollTracks", async () => {
		const catDatabase = await loadCatDatabaseForTest();
		const eventData = catDatabase.events["2025-12-09_1020"];

		if (!eventData) {
			throw new Error("Event 2025-12-09_1020 not found");
		}

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
