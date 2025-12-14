import { Link } from "@tanstack/react-router";
import { BookOpen, Cat, Crown, Home, Info, ListOrdered, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const { theme, toggleTheme } = useTheme();

	return (
		<>
			<header className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white shadow-xl border-b border-amber-400/20">
				<div className="flex items-center">
					<button
						type="button"
						onClick={() => setIsOpen(true)}
						className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 md:hidden"
						aria-label="Open menu"
					>
						<Menu size={24} />
					</button>
					<div className="ml-4 md:ml-0 flex items-center gap-3">
						<div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/25">
							<Cat size={24} className="text-indigo-950" />
						</div>
						<h1 className="text-xl font-bold tracking-tight">
							<span className="text-amber-400">Battle Cats</span>
							<span className="text-white/90"> Planner</span>
						</h1>
					</div>
				</div>

				{/* Desktop Navigation */}
				<nav className="hidden md:flex items-center gap-1">
					<button
						type="button"
						onClick={toggleTheme}
						className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-200"
						aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
					>
						{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
					</button>
					<Link
						to="/"
						className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-200"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-indigo-950 shadow-lg shadow-amber-500/25 transition-all duration-200",
						}}
					>
						<Home size={18} />
						<span className="font-semibold">Home</span>
					</Link>

					<Link
						to="/dictionary"
						className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-200"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-indigo-950 shadow-lg shadow-amber-500/25 transition-all duration-200",
						}}
					>
						<BookOpen size={18} />
						<span className="font-semibold">Dictionary</span>
					</Link>

					<Link
						to="/tierlist"
						className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-200"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-indigo-950 shadow-lg shadow-amber-500/25 transition-all duration-200",
						}}
					>
						<ListOrdered size={18} />
						<span className="font-semibold">Tier List</span>
					</Link>

					<Link
						to="/uber-planner"
						className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-200"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-indigo-950 shadow-lg shadow-amber-500/25 transition-all duration-200",
						}}
					>
						<Crown size={18} />
						<span className="font-semibold">Uber Planner</span>
					</Link>

					<Link
						to="/about"
						className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-200"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-indigo-950 shadow-lg shadow-amber-500/25 transition-all duration-200",
						}}
					>
						<Info size={18} />
						<span className="font-semibold">About</span>
					</Link>
				</nav>
			</header>

			{/* Mobile Sidebar Overlay */}
			{isOpen && (
				<button
					type="button"
					className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
					onClick={() => setIsOpen(false)}
					onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
				/>
			)}

			{/* Mobile Sidebar */}
			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-indigo-950 to-purple-950 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col md:hidden ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-white/10">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
							<Cat size={20} className="text-indigo-950" />
						</div>
						<h2 className="text-lg font-bold text-amber-400">Menu</h2>
					</div>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-white/10 rounded-xl transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto space-y-2">
					<button
						type="button"
						onClick={toggleTheme}
						className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200 w-full"
					>
						{theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
						<span className="font-semibold">{theme === "light" ? "Dark" : "Light"} Mode</span>
					</button>
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-indigo-950 shadow-lg transition-all duration-200",
						}}
					>
						<Home size={20} />
						<span className="font-semibold">Home</span>
					</Link>

					<Link
						to="/dictionary"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-indigo-950 shadow-lg transition-all duration-200",
						}}
					>
						<BookOpen size={20} />
						<span className="font-semibold">Cat Dictionary</span>
					</Link>

					<Link
						to="/tierlist"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-indigo-950 shadow-lg transition-all duration-200",
						}}
					>
						<ListOrdered size={20} />
						<span className="font-semibold">Tier List</span>
					</Link>

					<Link
						to="/uber-planner"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-indigo-950 shadow-lg transition-all duration-200",
						}}
					>
						<Crown size={20} />
						<span className="font-semibold">Uber Planner</span>
					</Link>

					<Link
						to="/about"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-indigo-950 shadow-lg transition-all duration-200",
						}}
					>
						<Info size={20} />
						<span className="font-semibold">About</span>
					</Link>
				</nav>
			</aside>
		</>
	);
}
