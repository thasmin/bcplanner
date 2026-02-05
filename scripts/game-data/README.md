# Battle Cats Game Data Builder

This script parses raw Battle Cats game data files from [BCData](https://git.battlecatsmodding.org/fieryhenry/BCData) and generates the `bc-en.json` file used by the catplanner app.

## Quick Start

```bash
# Clone BCData repository
git clone https://git.battlecatsmodding.org/fieryhenry/BCData.git

# Build the JSON data (adjust path to BCData as needed)
bun run build-data ./BCData
```

## Usage

```bash
# Default: reads from scripts/game-data/BCData, outputs to public/data/bc-en.json
bun run build-data

# With custom BCData path
bun run build-data ../BCData

# Full options: [bcdata-path] [output-file] [language]
bun run scripts/game-data/build.ts ../BCData public/data/bc-en.json en
```

## BCData Repository Structure

The script expects BCData to have this structure:

```
BCData/
  game_data/
    en/                     # Language (en, jp, kr, tw)
      15.0.1/               # Version (latest is auto-detected)
        DataLocal/
          GatyaDataSetR1.csv      # Gacha pool definitions
          GatyaData_Option_SetR.tsv # Gacha series IDs
          unitbuy.csv             # Cat rarity and max level
          unitlevel.csv           # Cat growth data
          nyankoPictureBookData.csv # Unit form counts
          unit001.csv ... unit999.csv # Cat stats
          SkillAcquisition.csv    # Talent data
        resLocal/
          Unit_Explanation1_en.csv ... # Cat names/descriptions
```

## Event Data

Event data (gacha schedules with dates and rates) is not included in BCData. The script will look for event TSV files in these locations:

1. `../battle-cats-rolls/data/en/events/` (if you have the Ruby project)
2. `BCData/events/en/`
3. `scripts/game-data/input/events/`

To add events manually, copy TSV files from the [battle-cats-rolls](https://gitlab.com/godfat/battle-cats-rolls) repository's `data/en/events/` directory.

## Output Format

The generated `bc-en.json` contains:

```typescript
{
  cats: {
    [catId: number]: {
      name: string[];      // Form names [normal, evolved, true form]
      desc: string[];      // Form descriptions
      stat: CatStat[];     // Stats per form
      rarity: number;      // 0=Normal, 1=Special, 2=Rare, 3=Super, 4=Uber, 5=Legend
      max_level: number;
      growth: number[];
      talent?: {...};      // Optional talent data
    }
  },
  gacha: {
    [poolId: number]: {
      cats: number[];      // Cat IDs in this pool
      series_id?: number;  // Banner series
      name?: string;       // Banner name (from events)
      rate?: string;       // Rate type: "regular", "uberfest", "platinum", etc.
      similarity?: number; // Event match confidence %
    }
  },
  events: {
    [eventKey: string]: {  // Key format: "YYYY-MM-DD_poolId"
      start_on: string;    // "YYYY-MM-DD"
      end_on: string;
      name: string;
      id: number;          // Gacha pool ID
      rare: number;        // Rare rate (out of 10000)
      supa: number;        // Super Rare rate
      uber: number;        // Uber rate
      legend?: number;     // Legend rate (if applicable)
      guaranteed?: boolean;
      step_up?: boolean;
      platinum?: string;   // "platinum", "legend", or "dl-100m"
    }
  }
}
```

## Supported Languages

- `en` - English (default)
- `jp` - Japanese
- `kr` - Korean
- `tw` - Traditional Chinese (Taiwan)

## Differences from battle-cats-rolls

This TypeScript implementation produces equivalent output to the Ruby [battle-cats-rolls](https://gitlab.com/godfat/battle-cats-rolls) project, with these differences:

1. **Attack duration**: Not calculated (requires parsing maanim animation files)
2. **Preserved gacha**: Not supported (manual gacha.yaml overrides)
3. **Data source**: Uses BCData instead of extracting from APK directly

For full feature parity with production, use `bun run update-data` which fetches pre-built data from battle-cats-rolls.
