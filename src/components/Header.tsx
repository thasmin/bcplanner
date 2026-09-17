import { Link } from "@tanstack/react-router";
import {
	BookOpen,
	Cat,
	Crown,
	Database,
	Home,
	Info,
	ListOrdered,
	Menu,
	Moon,
	Sparkles,
	Sun,
	X,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { CatCollectionDialog } from "./CatCollectionDialog";

const navItems = [
	{ to: "/", label: "Planner", icon: Home, tone: "gold" },
	{ to: "/uber-planner", label: "Ubers", icon: Crown, tone: "coral" },
	{ to: "/dictionary", label: "Dictionary", icon: BookOpen, tone: "teal" },
	{ to: "/tierlist", label: "Tiers", icon: ListOrdered, tone: "violet" },
	{ to: "/seed-finder", label: "Find seed", icon: Sparkles, tone: "sky" },
	{ to: "/about", label: "About", icon: Info, tone: "gold" },
] as const;

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [showCatCollection, setShowCatCollection] = useState(false);
	const { theme, toggleTheme } = useTheme();

	return (
		<>
			<CatCollectionDialog
				isOpen={showCatCollection}
				onClose={() => setShowCatCollection(false)}
			/>
			<header className="site-header">
				<div className="site-header-inner">
					<button
						type="button"
						onClick={() => setIsOpen(true)}
						className="icon-button md:hidden"
						aria-label="Open menu"
					>
						<Menu size={21} />
					</button>

					<Link to="/" className="site-brand">
						<span className="site-brand-mark">
							<Cat size={22} strokeWidth={2.4} />
						</span>
						<span>
							<strong>CatPlanner</strong>
							<small>Battle Cats roll guide</small>
						</span>
					</Link>

					<nav
						className="site-nav hidden md:flex"
						aria-label="Primary navigation"
					>
						{navItems.map(({ to, label, icon: Icon, tone }) => (
							<Link
								key={to}
								to={to}
								className="site-nav-link"
								data-tone={tone}
								activeProps={{
									className: "site-nav-link site-nav-link-active",
								}}
							>
								<Icon size={16} />
								<span>{label}</span>
							</Link>
						))}
					</nav>

					<div className="site-actions">
						<button
							type="button"
							onClick={() => setShowCatCollection(true)}
							className="site-collection hidden lg:flex"
						>
							<Database size={16} />
							Collection
						</button>
						<button
							type="button"
							onClick={toggleTheme}
							className="icon-button"
							aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
						>
							{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
						</button>
					</div>
				</div>
			</header>

			{isOpen && (
				<button
					type="button"
					className="mobile-menu-scrim md:hidden"
					onClick={() => setIsOpen(false)}
					aria-label="Close menu"
				/>
			)}

			<aside
				className={`mobile-menu md:hidden ${isOpen ? "mobile-menu-open" : ""}`}
				aria-hidden={!isOpen}
				inert={!isOpen}
			>
				<div className="mobile-menu-header">
					<span className="site-brand-mark">
						<Cat size={20} />
					</span>
					<strong>CatPlanner</strong>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="icon-button ml-auto"
						aria-label="Close menu"
					>
						<X size={21} />
					</button>
				</div>
				<nav className="mobile-nav" aria-label="Mobile navigation">
					{navItems.map(({ to, label, icon: Icon, tone }) => (
						<Link
							key={to}
							to={to}
							onClick={() => setIsOpen(false)}
							className="mobile-nav-link"
							data-tone={tone}
							activeProps={{
								className: "mobile-nav-link mobile-nav-link-active",
							}}
						>
							<Icon size={19} />
							{label}
						</Link>
					))}
					<button
						type="button"
						onClick={() => {
							setShowCatCollection(true);
							setIsOpen(false);
						}}
						className="mobile-nav-link"
					>
						<Database size={19} />
						Collection
					</button>
				</nav>
			</aside>
		</>
	);
}
