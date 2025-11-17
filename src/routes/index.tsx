import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Cat } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: App });

function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}

function App() {
	const [seed, setSeed] = useState(2428617162);

	const debouncedSeed = useDebounce(seed, 500);
	useEffect(() => {
		console.log("Debounced Seed:", debouncedSeed);
	}, [debouncedSeed]);

	const query = useQuery({
		queryKey: ["x", debouncedSeed],
		queryFn: () => {
			fetch(`https://bc.godfat.org/?seed=${debouncedSeed}`).then((res) =>
				res.text(),
			);
		},
	});
	console.log(query.data);

	return (
		<div className="p-4">
			<Cat />
			<div className="flex">
				Seed:{" "}
				<input
					type="text"
					value={seed}
					onChange={(e) =>
						setSeed(+(e.target.value.match(/\d+/g)?.join(" ") ?? 0))
					}
				/>
			</div>
		</div>
	);
}
