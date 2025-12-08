import path from "node:path";
import type { CatDatabase } from "@/data/gacha-data";

function getImageUrl(unit: number, stage: string): string {
	const filename = `Uni${unit.toString().padStart(3, "0")}_${stage}00.png`;
	const hash = Bun.MD5.hash(filename, "hex");
	return `https://static.wikitide.net/battlecatswiki/${hash[0]}/${hash[0]}${hash[1]}/${filename}`;
}

async function loadCatDatabaseForTest(): Promise<CatDatabase> {
	const filePath = path.join(import.meta.dir, "../../public/data/bc-en.json");
	const file = Bun.file(filePath);
	return await file.json();
}

async function downloadImages() {
	const catDB = await loadCatDatabaseForTest();
	for (const [catIdStr, catData] of Object.entries(catDB.cats)) {
		const catId = +catIdStr;

		if (catData.desc[0].startsWith("Spirit")) continue;

		const stages = ["f", "c", "s", "u"].slice(0, catData.name.length);
		let fetched = false;
		for (const stage of stages) {
			let imageUrl = getImageUrl(catId - 1, stage);
			if (catData.name[0].startsWith("Ancient Egg") && stage === "f")
				imageUrl =
					"https://static.wikitide.net/battlecatswiki/7/70/Uni000_m00.png";
			if (catData.name[0].startsWith("Ancient Egg") && stage === "c")
				imageUrl =
					"https://static.wikitide.net/battlecatswiki/c/c5/Uni001_m01.png";

			const imagePath = `./public/catImages/cat_${catId.toString().padStart(4, "0")}_${stages.indexOf(stage)}.png`;
			if (!(await Bun.file(imagePath).exists())) {
				console.log(
					`Cat ID: ${catId}, Stage: ${stage}, URL: ${imageUrl}, Path: ${imagePath}`,
				);
				fetched = true;
				await fetch(imageUrl)
					.then((r) => r.arrayBuffer())
					.then((buffer) => Bun.write(imagePath, new Uint8Array(buffer)));
			}
		}
		// Throttle requests
		if (fetched) await Bun.sleep(0.5);
	}
}

// Run the scraper if this file is executed directly
if (import.meta.main) {
	downloadImages();
}
