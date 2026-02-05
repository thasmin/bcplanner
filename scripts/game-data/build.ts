#!/usr/bin/env bun
/**
 * Build script to generate bc-en.json from Battle Cats game data files
 *
 * Usage:
 *   bun run scripts/game-data/build.ts [bcdata-path] [output-file] [lang]
 *
 * Examples:
 *   bun run build-data ../BCData
 *   bun run build-data ../BCData public/data/bc-en.json en
 *
 * BCData repository: https://git.battlecatsmodding.org/fieryhenry/BCData.git
 *
 * Expected BCData structure:
 *   BCData/
 *     game_data/
 *       en/
 *         15.0.1/
 *           DataLocal/
 *             GatyaDataSetR1.csv
 *             GatyaData_Option_SetR.tsv
 *             unitbuy.csv
 *             unitlevel.csv
 *             nyankoPictureBookData.csv
 *             unit*.csv
 *             SkillAcquisition.csv
 *           resLocal/
 *             Unit_Explanation*_en.csv
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import type { CatData, CatDatabase, GachaPoolData, EventData } from "./types";
import {
  parseGachaData,
  parseGachaOption,
  parseUnitBuy,
  parseUnitLevel,
  parseUnitForms,
  parseUnitExplanation,
  parseUnitStats,
  parseSkillAcquisition,
  parseEventTsv,
  matchGachaToEvents,
} from "./parsers";
import { fetchGatyaTsv, type Language } from "./fetch-gatya";

/**
 * Find the latest version directory in BCData for a given language
 */
function findLatestVersion(bcDataPath: string, lang: string): string {
  const langDir = join(bcDataPath, "game_data", lang);
  if (!existsSync(langDir)) {
    throw new Error(`Language directory not found: ${langDir}`);
  }

  const versions = readdirSync(langDir)
    .filter((d) => /^\d+\.\d+\.\d+$/.test(d))
    .sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
      const [bMajor, bMinor, bPatch] = b.split(".").map(Number);
      return bMajor - aMajor || bMinor - aMinor || bPatch - aPatch;
    });

  if (versions.length === 0) {
    throw new Error(`No version directories found in ${langDir}`);
  }

  return versions[0];
}

/**
 * Read file if it exists, return empty string otherwise
 */
function readFileIfExists(path: string): string {
  if (existsSync(path)) {
    return readFileSync(path, "utf-8");
  }
  return "";
}

async function main() {
  const bcDataPath = process.argv[2] || "scripts/game-data/BCData";
  const outputFile = process.argv[3] || "public/data/bc-en.json";
  const lang = (process.argv[4] || "en") as Language;

  console.log(`BCData path: ${bcDataPath}`);
  console.log(`Output file: ${outputFile}`);
  console.log(`Language: ${lang}`);

  // Check if BCData exists
  if (!existsSync(bcDataPath)) {
    console.error(`Error: BCData directory not found: ${bcDataPath}`);
    console.error(`\nPlease clone BCData first:`);
    console.error(
      `  git clone https://git.battlecatsmodding.org/fieryhenry/BCData.git`,
    );
    process.exit(1);
  }

  // Find latest version
  let version: string;
  try {
    version = findLatestVersion(bcDataPath, lang);
    console.log(`Using version: ${version}`);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }

  const dataLocalDir = join(
    bcDataPath,
    "game_data",
    lang,
    version,
    "DataLocal",
  );
  const resLocalDir = join(bcDataPath, "game_data", lang, version, "resLocal");

  if (!existsSync(dataLocalDir)) {
    console.error(`Error: DataLocal directory not found: ${dataLocalDir}`);
    process.exit(1);
  }

  // Parse gacha data
  console.log("Parsing gacha data...");
  const gachaFile = join(dataLocalDir, "GatyaDataSetR1.csv");
  if (!existsSync(gachaFile)) {
    console.error(`Error: Required file not found: GatyaDataSetR1.csv`);
    process.exit(1);
  }
  let gacha = parseGachaData(readFileSync(gachaFile, "utf-8"));
  console.log(`  Found ${Object.keys(gacha).length} gacha pools`);

  // Parse gacha options (series IDs)
  const gachaOptionFile = join(dataLocalDir, "GatyaData_Option_SetR.tsv");
  let gachaOption: Record<number, { series_id: number }> = {};
  if (existsSync(gachaOptionFile)) {
    gachaOption = parseGachaOption(readFileSync(gachaOptionFile, "utf-8"));
    console.log(`  Found ${Object.keys(gachaOption).length} gacha options`);
  }

  // Parse unitbuy for rarity and max_level
  console.log("Parsing unit data...");
  const unitbuyFile = join(dataLocalDir, "unitbuy.csv");
  if (!existsSync(unitbuyFile)) {
    console.error(`Error: Required file not found: unitbuy.csv`);
    process.exit(1);
  }
  const unitbuy = parseUnitBuy(readFileSync(unitbuyFile, "utf-8"));
  console.log(`  Found ${Object.keys(unitbuy).length} units in unitbuy`);

  // Parse unitlevel for growth data
  const unitlevelFile = join(dataLocalDir, "unitlevel.csv");
  let unitlevel: Record<number, number[]> = {};
  if (existsSync(unitlevelFile)) {
    unitlevel = parseUnitLevel(readFileSync(unitlevelFile, "utf-8"));
    console.log(`  Found ${Object.keys(unitlevel).length} units in unitlevel`);
  }

  // Parse unit forms
  const pictureBookFile = join(dataLocalDir, "nyankoPictureBookData.csv");
  let unitforms: Record<number, number> = {};
  if (existsSync(pictureBookFile)) {
    unitforms = parseUnitForms(readFileSync(pictureBookFile, "utf-8"));
    console.log(
      `  Found ${Object.keys(unitforms).length} units in picture book`,
    );
  }

  // Parse Unit_Explanation files for names and descriptions
  console.log("Parsing unit explanations...");
  const catExplanations: Record<number, { names: string[]; descs: string[] }> =
    {};

  if (existsSync(resLocalDir)) {
    const resFiles = readdirSync(resLocalDir);
    const explanationFiles = resFiles.filter(
      (f) => f.startsWith("Unit_Explanation") && f.endsWith(".csv"),
    );

    for (const file of explanationFiles) {
      const content = readFileSync(join(resLocalDir, file), "utf-8");
      const result = parseUnitExplanation(file, content);
      if (result) {
        catExplanations[result.id] = {
          names: result.names,
          descs: result.descs,
        };
      }
    }
  }
  console.log(
    `  Found ${Object.keys(catExplanations).length} unit explanations`,
  );

  // Parse unit stats
  console.log("Parsing unit stats...");
  const dataFiles = readdirSync(dataLocalDir);
  const unitFiles = dataFiles.filter((f) => /^unit\d+\.csv$/.test(f));
  const unitStats: Record<number, ReturnType<typeof parseUnitStats>> = {};

  for (const file of unitFiles) {
    const idMatch = file.match(/\d+/);
    if (idMatch) {
      const id = Number.parseInt(idMatch[0], 10);
      const content = readFileSync(join(dataLocalDir, file), "utf-8");
      const stats = parseUnitStats(content);
      if (stats.length > 0) {
        unitStats[id] = stats;
      }
    }
  }
  console.log(`  Found ${Object.keys(unitStats).length} unit stat files`);

  // Parse talents
  const skillFile = join(dataLocalDir, "SkillAcquisition.csv");
  let talents: Record<
    number,
    { talent_against?: string[]; talent?: Record<string, unknown> }
  > = {};
  if (existsSync(skillFile)) {
    talents = parseSkillAcquisition(readFileSync(skillFile, "utf-8"));
    console.log(`  Found ${Object.keys(talents).length} units with talents`);
  }

  // Parse events - fetch from Ponos servers or use local files
  console.log("Fetching events...");
  let events: Record<string, EventData> = {};

  // Try fetching from Ponos servers first
  try {
    console.log("  Fetching gatya.tsv from Ponos servers...");
    const gatyaTsv = await fetchGatyaTsv(lang, version);
    events = parseEventTsv(gatyaTsv);
    console.log(
      `  Fetched ${Object.keys(events).length} events from Ponos servers`,
    );
  } catch (error) {
    console.log(`  Failed to fetch from Ponos: ${(error as Error).message}`);
    console.log("  Falling back to local event files...");

    // Check for events in a few possible locations
    const eventsDirs = [
      join(bcDataPath, "..", "battle-cats-rolls", "data", lang, "events"),
      join(bcDataPath, "events", lang),
      "scripts/game-data/input/events",
    ];

    for (const eventsDir of eventsDirs) {
      if (existsSync(eventsDir)) {
        const eventFiles = readdirSync(eventsDir).filter((f) =>
          f.endsWith(".tsv"),
        );
        for (const file of eventFiles) {
          const content = readFileSync(join(eventsDir, file), "utf-8");
          const parsed = parseEventTsv(content);
          events = { ...events, ...parsed };
        }
        console.log(
          `  Found ${Object.keys(events).length} events from ${eventFiles.length} files in ${eventsDir}`,
        );
        break;
      }
    }

    if (Object.keys(events).length === 0) {
      console.log("  No events found locally either, events will be empty");
    }
  }

  // Build cats database
  console.log("Building cats database...");
  const cats: Record<number, CatData> = {};

  // Get all cat IDs from explanations (these are the cats with actual data)
  const catIds = Object.keys(catExplanations)
    .map(Number)
    .sort((a, b) => a - b);

  for (const id of catIds) {
    const explanation = catExplanations[id];
    const buy = unitbuy[id];
    const level = unitlevel[id];
    const forms = unitforms[id] || explanation.names.length;
    const stats = unitStats[id];
    const talentData = talents[id];

    if (!buy) continue;

    // Calculate growth array
    const growthSize = Math.ceil(buy.max_level / 10);
    const growth = level
      ? level.slice(0, growthSize).map((v) => Math.floor(v))
      : [];

    const cat: CatData = {
      name: explanation.names.slice(0, forms),
      desc: explanation.descs.slice(0, forms),
      stat: stats ? stats.slice(0, forms) : [],
      rarity: buy.rarity,
      max_level: buy.max_level,
      growth,
    };

    // Add talents if present
    if (talentData?.talent_against) {
      cat.talent_against = talentData.talent_against;
    }
    if (talentData?.talent) {
      cat.talent = talentData.talent;
    }

    cats[id] = cat;
  }
  console.log(`  Built ${Object.keys(cats).length} cats`);

  // Match gacha to events
  console.log("Matching gacha pools to events...");
  gacha = matchGachaToEvents(gacha, gachaOption, events);

  // Build final database
  const database: CatDatabase = {
    cats,
    gacha,
    events,
  };

  // Write output
  console.log(`Writing output to ${outputFile}...`);
  const jsonOutput = JSON.stringify(database, null, 2);
  writeFileSync(outputFile, jsonOutput);

  console.log("\nDone!");
  console.log(`  Cats: ${Object.keys(cats).length}`);
  console.log(`  Gacha pools: ${Object.keys(gacha).length}`);
  console.log(`  Events: ${Object.keys(events).length}`);
}

main().catch(console.error);
