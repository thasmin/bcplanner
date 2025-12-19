import { advanceSeed, createCat, UINT32_MAX } from "./battle-cats-gacha";
import { type CatDatabase, createGachaEvent } from "./gacha-data";

// Incrementally check if a seed matches the expected cat sequence
// Returns true if all cats match, false otherwise (with early exit)
function checkSeedMatches(
	event: ReturnType<typeof createGachaEvent>,
	initialSeed: number,
	expectedCatIds: number[],
): boolean {
	let currentSeed = initialSeed;

	// Check each cat incrementally with early exit
	for (let i = 0; i < expectedCatIds.length; i++) {
		const raritySeed = advanceSeed(currentSeed);
		const slotSeed = advanceSeed(raritySeed);
		const catId = createCat(event, raritySeed, slotSeed);

		if (catId !== expectedCatIds[i]) {
			return false; // Early exit on first mismatch
		}

		// Move to next roll (skip the two seeds we just used)
		currentSeed = slotSeed;
	}

	return true; // All cats matched
}
const PROGRESS_INTERVAL = 50000; // Report progress every 50k seeds
const YIELD_INTERVAL = 100000; // Yield control every 100k seeds to check for stop messages

let shouldStop = false;

// Helper to yield control back to event loop
const yieldToEventLoop = () => new Promise((resolve) => setTimeout(resolve, 0));

self.onmessage = async (
	msg: MessageEvent<
		| {
				type: "start";
				catDatabase: CatDatabase;
				selectedCatIds: number[];
				seedStart?: number;
				seedEnd?: number;
				workerId?: number;
		  }
		| { type: "stop" }
	>,
) => {
	if (msg.data.type === "stop") {
		shouldStop = true;
		return;
	}

	const {
		catDatabase,
		selectedCatIds,
		seedStart = 0,
		seedEnd = UINT32_MAX,
		workerId = 0,
	} = msg.data;
	if (selectedCatIds.length < 5) {
		self.postMessage({
			type: "error",
			message: "Please select at least 5 cats",
		});
		return;
	}

	shouldStop = false;

	const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
	const currentEvents = Object.entries(catDatabase.events)
		.map(([code, event]) => ({ code, ...event }))
		.filter(
			(event) =>
				!event.platinum && event.start_on <= today && event.end_on >= today,
		);

	// Remove duplicate events
	for (let i = 0; i < currentEvents.length; ++i) {
		if (
			currentEvents.findIndex((event) => event.id === currentEvents[i].id) !== i
		) {
			currentEvents.splice(i, 1);
			--i;
		}
	}

	if (currentEvents.length === 0) {
		self.postMessage({
			type: "error",
			message: "No active gacha events found for today",
		});
		return;
	}

	const startTime = Date.now();
	const totalSeeds = seedEnd - seedStart;
	let seedsChecked = 0;
	const matchingSeeds: number[] = [];

	// Pre-create gacha events for all current events
	const gachaEvents = currentEvents.map((event) => ({
		event,
		gachaEvent: createGachaEvent(event, catDatabase),
	}));

	// Search through assigned seed range
	for (let seed = seedStart; seed < seedEnd; ++seed) {
		seedsChecked++;

		if (shouldStop) {
			self.postMessage({
				type: "stopped",
				seedsChecked,
				workerId,
				matchingSeeds,
			});
			return;
		}

		// Yield control periodically to allow processing stop messages
		if (seed % YIELD_INTERVAL === 0) {
			await yieldToEventLoop();
		}

		// Check this seed against all events (stop at first match)
		for (const { event, gachaEvent } of gachaEvents) {
			// OPTIMIZATION: Incremental checking with early exit
			// Check each cat one by one and exit immediately on mismatch
			if (checkSeedMatches(gachaEvent, seed, selectedCatIds)) {
				matchingSeeds.push(seed);
				// Report match but continue searching
				self.postMessage({
					type: "match",
					seed,
					eventId: event.id,
					eventName: event.name,
					totalMatches: matchingSeeds.length,
					workerId,
				});
				// Found match in this event, no need to check other events for this seed
				break;
			}
		}

		// Report progress
		if (seedsChecked % PROGRESS_INTERVAL === 0) {
			const elapsed = Date.now() - startTime;
			const seedsPerSecond = (seedsChecked / elapsed) * 1000;
			const remainingSeeds = totalSeeds - seedsChecked;
			const etaSeconds = remainingSeeds / seedsPerSecond;
			const progress = (seedsChecked / totalSeeds) * 100;

			self.postMessage({
				type: "progress",
				seedsChecked,
				totalSeeds,
				progress,
				seedsPerSecond,
				etaSeconds,
				currentEvent: gachaEvents[0]?.event.name || "",
				workerId,
			});
		}
	}

	// Search complete - report all found seeds
	const elapsed = Date.now() - startTime;
	self.postMessage({
		type: "complete",
		seedsChecked,
		timeElapsed: elapsed,
		matchingSeeds,
		workerId,
	});
};
