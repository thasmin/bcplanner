# Battle Cats Gacha Integration

This document explains the Battle Cats gacha roll prediction functionality that has been integrated into the catplanner app.

## Files Added

### Source Files (`src/data/`)
- **`battle-cats-gacha.ts`** - Core gacha simulation algorithm
  - XORShift32 RNG implementation
  - Rarity determination logic
  - Cat selection from pools
  - Functions to simulate N rolls

- **`gacha-data.ts`** - Helper functions for loading and processing data
  - JSON data loading functions
  - Event configuration creation
  - Event list generation for dropdown

### Data Files (`public/data/`)
- **`bc-en.json`** (1.7MB) - Complete cat database
  - All cat names, descriptions, stats
  - Indexed by cat ID
  - Includes all forms of each cat

## How It Works

### 1. Seed-Based RNG
The Battle Cats gacha system uses a deterministic XORShift32 algorithm:
```typescript
function advanceSeed(seed: number): number {
  seed = seed ^ (seed << 13);
  seed = seed ^ (seed >>> 17);
  seed = seed ^ (seed << 15);
  return seed;
}
```

### 2. Roll Process
Each gacha roll requires two seed advances:
1. **First advance**: Determines rarity (Rare/Super Rare/Uber/Legend)
   - `score = seed % 10000`
   - Maps to rarity ranges based on event rates

2. **Second advance**: Determines which cat
   - `slot = seed % pool_size`
   - Gets cat ID from the rarity pool

### 3. Event Configuration
Each event has:
- **Cat pool**: List of cat IDs available
- **Rates**: Probability distribution (e.g., 70% rare, 25% super rare, 5% uber)
- **Version**: Game version (affects fruit value calculation)

## Usage in the App

The index route (`src/routes/index.tsx`) now includes:

1. **Seed Input**: Enter your game seed
2. **Event Dropdown**: Select from available gacha events
3. **Roll Table**: Shows next 100 predicted rolls with:
   - Roll number
   - Cat name
   - Rarity (color-coded)
   - Cat ID
   - Score

4. **Statistics**: Summary of rarity distribution

## API Reference

### Main Functions

```typescript
// Simulate multiple rolls
rollMultiple(seed: number, event: GachaEvent, count: number): RollResult[]

// Load cat database
loadCatDatabase(): Promise<CatDatabase>

// Create event configuration
createGachaEvent(
  eventId: string,
  gachaPool: GachaPoolData,
  catDatabase: CatDatabase
): GachaEvent
```

### Types

```typescript
interface RollResult {
  rollNumber: number;
  seed: number;
  rarity: Rarity;
  rarityName: string;
  catId: number;
  slot: number;
  score: number;
}

interface GachaEvent {
  id: string | number;
  slots: {
    [Rarity.Rare]?: number[];
    [Rarity.SuperRare]?: number[];
    [Rarity.Uber]?: number[];
    [Rarity.Legend]?: number[];
  };
  rates: {
    rare: number;
    supa: number;
    uber: number;
  };
  version?: '8.4' | '8.5' | '8.6';
}
```

## Example

For seed `2428617162` with event `943`:
1. Roll #1: Juliet Cat (Super Rare)
2. Roll #2: Pirate Cat (Rare)
3. Roll #3: Gardener Cat (Rare)

This matches the actual game behavior perfectly!

## Performance Notes

- Cat database is loaded once and cached indefinitely
- Event data is loaded once and cached indefinitely
- Using JSON instead of YAML for faster parsing (no external parser needed)
- Roll calculations are performed client-side (very fast)
- Debounced seed input prevents excessive recalculations
- Total bundle size: ~1.7MB for cat database + 228B for events

## Future Enhancements

Potential improvements:
- Add dual-track (A/B) rolling support
- Implement guaranteed uber mechanics
- Add track switching predictions
- Show duplicate cat re-rolling (v8.6+)
- Export results to CSV
- Search for specific cats
- Highlight upcoming ubers

## Credits

Based on the Battle Cats Rolls codebase:
https://github.com/godfat/battle-cats-rolls

Algorithm reverse-engineered from the mobile game "The Battle Cats" by PONOS.
