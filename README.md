# CatPlanner

A strategic planning tool for **The Battle Cats** mobile game. Plan your gacha rolls, discover upcoming Uber cats, browse the complete cat encyclopedia, and view tier rankings - all with a beautiful, modern interface.

## What is Battle Cats?

[The Battle Cats](https://en.wikipedia.org/wiki/The_Battle_Cats) is a popular tower defense mobile game by PONOS. Players collect various cat units through a gacha system to battle across hundreds of stages. The game uses a deterministic seed-based system for gacha rolls, making it possible to predict future pulls.

## Features

### 🎲 Roll Planner
Predict your next 100 gacha rolls based on your seed number. The planner shows:
- Dual-track (A/B) roll predictions
- Cat names and rarities with color coding
- Guaranteed Uber mechanics for eligible events
- Duplicate reroll detection and track switching
- Quick seed navigation to jump to any roll

### 👑 Uber Planner
Find the best opportunities to get Uber-rarity cats across all active events. This strategic tool:
- Scans all current guaranteed Uber events
- Shows which rolls will give you Ubers on each track
- Helps optimize your cat food spending
- Displays tier rankings to prioritize the best cats

### 📖 Cat Dictionary
Browse and search the complete database of Battle Cats units:
- 800+ cats with images, descriptions, and stats
- Filter by rarity (Normal, Special, Rare, Super Rare, Uber, Legend)
- Search by name or ID
- Detailed cat information in interactive dialogs

### 🏆 Tier Lists
View community-curated tier rankings for strategic planning:
- General tier list for standard gameplay
- Special event tier lists (e.g., EVANGELION collab)
- Visual rankings from SS to F tier
- Click any cat for detailed information

## How It Works

The Battle Cats uses a deterministic **XORShift32** random number generator for its gacha system. This means that if you know your seed, you can predict every future roll with 100% accuracy.

Each roll uses two RNG advances:
1. **Rarity determination** - Decides if you get Rare/Super Rare/Uber/Legend
2. **Cat selection** - Picks which specific cat from that rarity pool

The algorithm is reverse-engineered from the game and matches in-game results perfectly.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or Node.js

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/catplanner.git
cd catplanner

# Install dependencies
bun install
```

### Development

```bash
# Start the development server
bun run dev
```

The app will be available at `http://localhost:6990`

### Production Build

```bash
# Build for production
bun run build

# Preview the production build
bun run serve
```

## Finding Your Seed

To use the Roll Planner and Uber Planner, you'll need your Battle Cats seed number. This typically requires:
1. Using a seed tracking app or tool
2. Comparing your recent rolls to known event data
3. Using community resources like the Battle Cats Discord

**Note:** This tool does not extract seeds from the game - you must obtain your seed through other means.

## Tech Stack

- **Framework:** React + TanStack Router
- **Runtime:** Bun
- **Styling:** Tailwind CSS 4
- **Data Fetching:** TanStack Query
- **Build Tool:** Vite
- **Linting/Formatting:** Biome

## Project Structure

```
catplanner/
├── src/
│   ├── routes/          # Page components
│   ├── components/      # Reusable UI components
│   ├── data/           # Gacha algorithm & data loading
│   └── utils.ts        # Helper functions
├── public/
│   └── data/           # Cat database and images
└── GACHA_INTEGRATION.md # Technical documentation
```

## Development

### Testing

```bash
bun test
```

### Linting & Formatting

```bash
bun run lint    # Check for issues
bun run format  # Format code
bun run check   # Run both checks
```

## Credits

- Gacha algorithm reverse-engineered from [battle-cats-rolls](https://github.com/godfat/battle-cats-rolls) by godfat
- The Battle Cats is developed by [PONOS](https://www.ponos.co.jp/)
- This is a fan-made tool and is not affiliated with or endorsed by PONOS

## License

This project is open source and available for educational purposes. The Battle Cats and all related content are property of PONOS.
