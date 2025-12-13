import { Link } from "@tanstack/react-router";
import { BookOpen, Crown, Home, ListOrdered, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<header className="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
				<div className="flex items-center">
					<button
						type="button"
						onClick={() => setIsOpen(true)}
						className="p-2 hover:bg-gray-700 rounded-lg transition-colors md:hidden"
						aria-label="Open menu"
					>
						<Menu size={24} />
					</button>
					<h1 className="ml-4 md:ml-0 text-xl font-semibold">Battle Cats Planner</h1>
				</div>

				{/* Desktop Navigation */}
				<nav className="hidden md:flex items-center gap-2">
					<Link
						to="/"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					<Link
						to="/dictionary"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors",
						}}
					>
						<BookOpen size={20} />
						<span className="font-medium">Cat Dictionary</span>
					</Link>

					<Link
						to="/tierlist"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors",
						}}
					>
						<ListOrdered size={20} />
						<span className="font-medium">Tier List</span>
					</Link>

					<Link
						to="/uber-planner"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors",
						}}
					>
						<Crown size={20} />
						<span className="font-medium">Uber Planner</span>
					</Link>
				</nav>
			</header>

			{/* Mobile Sidebar */}
			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<h2 className="text-xl font-bold">Navigation</h2>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					<Link
						to="/dictionary"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<BookOpen size={20} />
						<span className="font-medium">Cat Dictionary</span>
					</Link>

					<Link
						to="/tierlist"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<ListOrdered size={20} />
						<span className="font-medium">Tier List</span>
					</Link>

					<Link
						to="/uber-planner"
						onClick={() => setIsOpen(false)}
						className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Crown size={20} />
						<span className="font-medium">Uber Planner</span>
					</Link>
				</nav>
			</aside>
		</>
	);
}
