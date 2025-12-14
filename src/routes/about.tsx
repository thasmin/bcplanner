import { createFileRoute } from "@tanstack/react-router";
import { Info, Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/about")({ component: About });

function About() {
	return (
		<div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
			<div className="flex items-center gap-3">
				<div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/20">
					<Info className="w-7 h-7 text-indigo-950" />
				</div>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
						About CatPlanner
					</h1>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						Strategic planning for The Battle Cats
					</p>
				</div>
			</div>

			<div className="bg-white/80 dark:bg-slate-800 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 md:p-8 space-y-6">
				<p className="text-slate-700 dark:text-slate-100 text-lg leading-relaxed">
					A strategic planning tool for{" "}
					<span className="font-semibold text-indigo-700 dark:text-indigo-300">
						The Battle Cats
					</span>{" "}
					mobile game. Plan your gacha rolls, discover upcoming Uber cats,
					browse the complete cat encyclopedia, and view tier rankings - all
					with a beautiful, modern interface.
				</p>

				<div>
					<h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-3">
						What is Battle Cats?
					</h2>
					<p className="text-slate-700 dark:text-slate-100 leading-relaxed">
						<a
							href="https://en.wikipedia.org/wiki/The_Battle_Cats"
							target="_blank"
							rel="noopener noreferrer"
							className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline font-medium"
						>
							The Battle Cats
						</a>{" "}
						is a popular tower defense mobile game by PONOS. Players collect
						various cat units through a gacha system to battle across hundreds
						of stages. The game uses a deterministic seed-based system for gacha
						rolls, making it possible to predict future pulls.
					</p>
				</div>
			</div>

			<div className="bg-white/80 dark:bg-slate-800 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 md:p-8">
				<h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-4">
					Features
				</h2>

				<div className="space-y-4">
					<div className="border-l-4 border-blue-400 pl-4">
						<h3 className="font-bold text-slate-800 dark:text-slate-50 mb-2">
							🎲 Roll Planner
						</h3>
						<p className="text-slate-700 dark:text-slate-100 leading-relaxed mb-2">
							Predict your next 100 gacha rolls based on your seed number. The
							planner shows:
						</p>
						<ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 ml-4">
							<li>Dual-track (A/B) roll predictions</li>
							<li>Cat names and rarities with color coding</li>
							<li>Guaranteed Uber mechanics for eligible events</li>
							<li>Duplicate reroll detection and track switching</li>
							<li>Quick seed navigation to jump to any roll</li>
						</ul>
					</div>

					<div className="border-l-4 border-amber-400 pl-4">
						<h3 className="font-bold text-slate-800 dark:text-slate-50 mb-2">
							👑 Uber Planner
						</h3>
						<p className="text-slate-700 dark:text-slate-100 leading-relaxed mb-2">
							Find the best opportunities to get Uber-rarity cats across all
							active events. This strategic tool:
						</p>
						<ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 ml-4">
							<li>Scans all current guaranteed Uber events</li>
							<li>Shows which rolls will give you Ubers on each track</li>
							<li>Helps optimize your cat food spending</li>
							<li>Displays tier rankings to prioritize the best cats</li>
						</ul>
					</div>

					<div className="border-l-4 border-emerald-400 pl-4">
						<h3 className="font-bold text-slate-800 dark:text-slate-50 mb-2">
							📖 Cat Dictionary
						</h3>
						<p className="text-slate-700 dark:text-slate-100 leading-relaxed mb-2">
							Browse and search the complete database of Battle Cats units:
						</p>
						<ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 ml-4">
							<li>800+ cats with images, descriptions, and stats</li>
							<li>
								Filter by rarity (Normal, Special, Rare, Super Rare, Uber,
								Legend)
							</li>
							<li>Search by name or ID</li>
							<li>Detailed cat information in interactive dialogs</li>
						</ul>
					</div>

					<div className="border-l-4 border-purple-400 pl-4">
						<h3 className="font-bold text-slate-800 dark:text-slate-50 mb-2">
							🏆 Tier Lists
						</h3>
						<p className="text-slate-700 dark:text-slate-100 leading-relaxed mb-2">
							View community-curated tier rankings for strategic planning:
						</p>
						<ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 ml-4">
							<li>General tier list for standard gameplay</li>
							<li>Special event tier lists (e.g., EVANGELION collab)</li>
							<li>Visual rankings from SS to F tier</li>
							<li>Click any cat for detailed information</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="bg-white/80 dark:bg-slate-800 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 md:p-8">
				<h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-4">
					Roadmap
				</h2>
				<ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 ml-4">
					<li>
						Improve game data source. Right now it uses weekly drops from
						battle-cats-rolls project
					</li>
					<li>Add the event's uber pool name (like Elemental Pixies)</li>
					<li>
						Improve the planner to consolidate the same cats from different
						events
					</li>
					<li>
						Improve the planner so it produces a list of steps of when to use
						rare tickets and cat food for different events
					</li>
					<li>Add stats to the cat popup dialog</li>
					<li>More filters to the Dictionary</li>
					<li>Figure out your seed based on rolls</li>
					<li>
						Better explanation of how things work and how to switch tracks
					</li>
					<li>Better mobile responsiveness</li>
					<li>Track which cats you already have</li>
					<li>Cat comparison tool</li>
					<li>Platinum/Legend ticket helper</li>
					<li>Sharing</li>
				</ul>
			</div>

			<div className="bg-white/80 dark:bg-slate-800 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 md:p-8">
				<h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-4">
					Credits
				</h2>
				<div className="space-y-3 text-slate-700 dark:text-slate-100 leading-relaxed">
					<p>
						Special thanks to{" "}
						<a
							href="https://bc.godfat.org"
							target="_blank"
							rel="noopener noreferrer"
							className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline font-medium"
						>
							Lin Jen-Shin
						</a>{" "}
						for creating the wonderful roll tracker at bc.godfat.org and making
						it open source at{" "}
						<a
							href="https://gitlab.com/godfat/battle-cats-rolls"
							target="_blank"
							rel="noopener noreferrer"
							className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-400 underline font-medium"
						>
							battle-cats-rolls
						</a>
						. The gacha algorithm used in this site is based on that project.
					</p>
					<p>
						Thanks to <span className="font-medium">t123fg4 on Reddit</span> for
						creating the tier list, and{" "}
						<span className="font-medium">Waver_Velvet26 on Reddit</span> for
						providing tier information. Special thanks to{" "}
						<span className="font-medium">Additional-Dinner-68 on Reddit</span>{" "}
						for ranking the EVANGELION cats.
					</p>
				</div>
			</div>

			<div className="bg-white/80 dark:bg-slate-800 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 md:p-8">
				<h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-4 flex items-center gap-2">
					<MessageCircle className="w-5 h-5" />
					Contact
				</h2>
				<p className="text-slate-700 dark:text-slate-100 leading-relaxed mb-4">
					Have questions, feedback, or suggestions? Feel free to reach out!
				</p>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<a
						href="https://x.com/thasmin"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-800 dark:to-indigo-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-600 dark:hover:to-indigo-600 rounded-xl border border-blue-200 dark:border-blue-700 transition-all duration-200"
					>
						<div className="p-2 bg-blue-500 dark:bg-blue-800 rounded-lg text-white mt-0.5">
							<svg
								className="w-4 h-4"
								fill="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
							</svg>
						</div>
						<div className="flex-1">
							<div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
								X (Twitter)
							</div>
							<div className="text-blue-600 dark:text-blue-400 font-medium">
								@thasmin
							</div>
						</div>
					</a>

					<a
						href="https://reddit.com/user/thasmin"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-800 dark:to-red-800 hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-600 dark:hover:to-red-600 rounded-xl border border-orange-200 dark:border-orange-700 transition-all duration-200"
					>
						<div className="p-2 bg-orange-500 dark:bg-orange-800 rounded-lg text-white mt-0.5">
							<svg
								className="w-4 h-4"
								fill="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
							</svg>
						</div>
						<div className="flex-1">
							<div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
								Reddit
							</div>
							<div className="text-orange-600 dark:text-orange-400 font-medium">
								u/thasmin
							</div>
						</div>
					</a>

					<a
						href="mailto:dan@axelby.com"
						className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-800 dark:to-pink-800 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-600 dark:hover:to-pink-600 rounded-xl border border-purple-200 dark:border-purple-700 transition-all duration-200"
					>
						<div className="p-2 bg-purple-500 dark:bg-purple-800 rounded-lg text-white mt-0.5">
							<Mail className="w-4 h-4" />
						</div>
						<div className="flex-1">
							<div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
								Email
							</div>
							<div className="text-purple-600 dark:text-purple-400 font-medium">
								dan@axelby.com
							</div>
						</div>
					</a>
				</div>
			</div>

			<div className="bg-white/80 dark:bg-slate-800 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 md:p-8">
				<h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-3">
					Open Source
				</h2>
				<p className="text-slate-700 dark:text-slate-200 leading-relaxed">
					This project is open source and available on GitHub. Feel free to
					contribute, report issues, or fork the project for your own use.
				</p>
				<a
					href="https://github.com/thasmin/bcplanner"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-slate-800 dark:bg-slate-500 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
				>
					<svg
						className="w-5 h-5"
						fill="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							fillRule="evenodd"
							d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
							clipRule="evenodd"
						/>
					</svg>
					View on GitHub
				</a>
			</div>

			<div className="bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-4 md:p-6">
				<p className="text-sm text-slate-600 dark:text-slate-300 text-center">
					This is a fan-made tool and is not affiliated with or endorsed by
					PONOS.
					<br />
					The Battle Cats and all related content are property of PONOS.
				</p>
			</div>
		</div>
	);
}
