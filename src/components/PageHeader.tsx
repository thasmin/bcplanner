import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
	icon: LucideIcon;
	title: string;
	description: React.ReactNode;
	tone?: "gold" | "coral" | "teal" | "violet" | "sky";
}

export function PageHeader({
	icon: Icon,
	title,
	description,
	tone = "gold",
}: PageHeaderProps) {
	return (
		<header className="page-heading">
			<div className="page-heading-mark" data-tone={tone} aria-hidden="true">
				<Icon size={22} strokeWidth={2.25} />
			</div>
			<div>
				<h1>{title}</h1>
				<div className="page-heading-description">{description}</div>
			</div>
		</header>
	);
}
