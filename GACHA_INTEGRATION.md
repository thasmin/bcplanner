# Battle Cats Gacha Integration

This document provides technical details about the Battle Cats gacha roll prediction system implemented in CatPlanner. For user-facing documentation, see the main [README.md](./README.md).

## Architecture Overview

The gacha prediction system consists of three main components:

1. **Core Algorithm** (`src/data/battle-cats-gacha.ts`) - Deterministic RNG simulation
2. **Data Layer** (`src/data/gacha-data.ts`) - Cat database and event configuration loading
3. **UI Components** (`src/routes/`) - User interfaces for different planning workflows

## File Structure

### Source Files (`src/data/`)

- **`battle-cats-gacha.ts`** - Core gacha simulation engine
  - XORShift32 RNG implementation with forward/reverse seed calculation
  - Dual-track (A/B) rolling system
  - Duplicate cat reroll detection and handling
  - Guaranteed Uber mechanics (10-roll and 15-roll Step Up)
  - Track switching logic

- **`gacha-data.ts`** - Data management layer
  - Async cat database loading with TanStack Query integration
  - Event configuration creation from raw event data
  - Event filtering (active/future events only)
  - Event display name formatting

### Data Files (`public/data/`)

- **`bc-en.json`** (~1.7MB) - Complete Battle Cats database
  - 800+ cat entries with names, descriptions, stats
  - Gacha pool definitions for all events
  - Event configurations with dates and rates
  - Indexed by cat ID for O(1) lookups

- **`images.json`** - Cat image URL mappings for the Cat Dictionary

## How It Works

### 1. XORShift32 Random Number Generator

Battle Cats uses a **deterministic** XORShift32 PRNG, which allows perfect prediction:

```typescript
function advanceSeed(seed: number): number {
  seed = seed ^ (seed << 13);   // XOR with left shift
  seed = seed ^ (seed >>> 17);  // XOR with unsigned right shift
  seed = seed ^ (seed << 15);   // XOR with left shift
  return seed;
}
```

The seed can also be **retreated** to find previous states:

```typescript
function retreatSeed(seed: number): number {
  // Applies inverse XOR operations
  // Useful for analyzing past rolls or debugging
}
```

### 2. Dual-Track Rolling System

The game maintains **two parallel timelines** (Track A and Track B):

- **Track A**: Uses the current seed
- **Track B**: Uses `advanceSeed(seed)` (one step ahead)
- When a duplicate cat is rerolled, the player switches to the alternate track
- Understanding track switches is crucial for strategic planning

### 3. Roll Process

Each gacha roll consumes **two seed advances**:

**Step 1: Rarity Determination**
```typescript
score = seed % 10000
if (score < rare_rate) → Rare cat
else if (score < rare_rate + supa_rate) → Super Rare cat
else if (score < rare_rate + supa_rate + uber_rate) → Uber cat
else → Legend cat
```

**Step 2: Cat Selection**
```typescript
slot = seed % pool_size
catId = pool[slot]
```

**Step 3: Duplicate Check (v8.6+)**
```typescript
if (catId === previousCatId) {
  // Reroll within the rarity pool, excluding duplicates
  // Switch to alternate track
}
```

### 4. Guaranteed Uber Mechanics

Events can have guaranteed Uber rolls:

- **Standard Guaranteed**: Every 10th roll on the event guarantees an Uber
- **Step Up**: Every 15th roll guarantees an Uber (better value)

The system simulates forward to calculate:
- Which Uber you'll receive from the guarantee
- Which track/position you'll be on after the guarantee
- Accounts for track switches caused by rerolls during the 10/15 roll sequence

## Implementation Details

### Core Function: `rollTracks()`

```typescript
export function rollTracks(
  event: GachaEvent,
  seed: number,
  count: number
): {
  trackA: TrackRolls[];
  trackB: TrackRolls[];
}
```

This function:
1. Pre-calculates all necessary seeds (2 per roll × count × tracks)
2. Simulates Track A starting from `seed`
3. Simulates Track B starting from `advanceSeed(seed)`
4. Detects duplicates and calculates rerolls
5. Computes guaranteed Uber results if applicable
6. Returns parallel arrays of roll results

### Track Roll Result Type

```typescript
interface TrackRolls {
  score: number;                    // Rarity roll score (0-9999)
  nextSeed: number;                 // Seed after this roll
  catId: number;                    // Cat ID obtained
  switchedFromCatId?: number;       // If rerolled, the original cat
  guaranteedUberId?: number;        // Uber from guaranteed if used here
  nextAfterGuaranteed?: string;     // Position after guarantee (e.g., "26B")
}
```

### Data Loading

The app uses **TanStack Query** for efficient data management:

```typescript
const catDatabaseQuery = useQuery({
  queryKey: ["catDatabase"],
  queryFn: loadCatDatabase,
  staleTime: Infinity,  // Never refetch - data is static
});
```

This provides:
- Automatic loading states
- Error handling
- Cached data across components
- No redundant network requests

## Routes and Features

### 1. Roll Planner (`src/routes/index.tsx`)

**Purpose**: Detailed view of next 100 rolls for a specific event

**Features**:
- Seed input with numeric validation
- Event selector (active events only)
- Side-by-side Track A and Track B comparison
- Rarity color coding
- Reroll indicators showing track switches
- Guaranteed Uber predictions
- Tier ranking badges for Uber cats
- Seed jump buttons to navigate the timeline

### 2. Uber Planner (`src/routes/uber-planner.tsx`)

**Purpose**: Find Uber cats across ALL active events

**Features**:
- Scans all guaranteed Uber events simultaneously
- Groups results by roll position
- Shows which events give Ubers at each position
- Displays tier rankings for strategic prioritization
- Helps optimize cat food spending across multiple events

### 3. Cat Dictionary (`src/routes/dictionary.tsx`)

**Purpose**: Browse and search the complete cat database

**Features**:
- Search by name or cat ID
- Filter by rarity
- Cat images from sprite sheets
- Detailed cat dialog with full stats
- 800+ cats indexed and searchable

### 4. Tier List (`src/routes/tierlist.tsx`)

**Purpose**: View community tier rankings

**Features**:
- Standard tier list (SS to F rankings)
- Special event tier lists (e.g., EVANGELION collab)
- Visual tier grouping with color coding
- Clickable cats for detailed information

## Performance Optimizations

1. **Static Data Caching**: Cat database loaded once, cached forever
2. **Client-side Computation**: All roll calculations happen in-browser (instant)
3. **Efficient Algorithms**: Pre-calculates seed array instead of iterative advancement
4. **React Query**: Prevents duplicate fetches and provides instant cache hits
5. **JSON Format**: Faster parsing than YAML, no external dependencies
6. **Responsive UI**: Optimized for both mobile and desktop viewing

## Technical Challenges Solved

### 1. Guaranteed Uber Track Switching

**Problem**: When using a guaranteed Uber, the game advances 10 (or 15) rolls, and if any duplicates occur during this sequence, track switches happen.

**Solution**: The `rollTrack()` function simulates all 10/15 rolls forward, detecting duplicates and counting switches to calculate the final track position.

### 2. Duplicate Reroll Algorithm

**Problem**: When a duplicate is detected, the game rerolls by removing the duplicate from the pool and selecting again.

**Solution**: The `rerollCat()` function maintains a shrinking pool, advancing the seed until a non-duplicate is found, tracking the number of steps.

### 3. Event Date Filtering

**Problem**: Historical events clutter the event selector.

**Solution**: `getEventOptions()` filters events by `end_on >= today`, showing only active and future events.

## Future Enhancement Ideas

Potential improvements for contributors:

- **Seed Tracker Integration**: Auto-sync with popular seed tracking apps
- **Export Functionality**: Download roll predictions as CSV/JSON
- **Advanced Filters**: Find specific cats in next N rolls
- **Notification System**: Alert when target cats are coming up
- **Probability Calculator**: Statistical analysis of roll outcomes
- **Mobile App**: Native iOS/Android versions
- **User Accounts**: Save multiple seeds, track inventory
- **Gacha Simulator**: Practice rolling without spending cat food

## Testing

The gacha algorithm has test coverage to ensure accuracy:

```bash
bun test src/data/battle-cats-gacha.test.ts
```

Tests verify:
- Seed advancement/retreat cycles
- Rarity determination at boundary conditions
- Duplicate reroll logic
- Track switching mechanics

## Debugging Tips

1. **Seed Validation**: Use the dice button to jump to any roll and verify the sequence
2. **Track Switches**: Check the "Rerolled from X" indicators to validate duplicate detection
3. **Guaranteed Ubers**: Compare predicted Uber with in-game results to verify accuracy
4. **Console Logging**: The code includes error logging for missing event/cat data

## Credits

- **Algorithm**: Reverse-engineered from Battle Cats by the community
- **Reference Implementation**: [godfat/battle-cats-rolls](https://github.com/godfat/battle-cats-rolls)
- **Game Developer**: PONOS Corporation
- **Disclaimer**: This is an unofficial fan tool, not affiliated with or endorsed by PONOS

## Related Resources

- [Battle Cats Wiki](https://battle-cats.fandom.com/)
- [Battle Cats Reddit](https://www.reddit.com/r/battlecats/)
- [Official Game Site](https://www.ponos.co.jp/)
