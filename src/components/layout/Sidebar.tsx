import { Link } from "@tanstack/react-router";
import { ProgressBadge } from "./ProgressBadge";

export interface SidebarLevel {
	slug: string;
	label: string;
	total: number;
	ids?: string[];
}

interface SidebarProps {
	section: "fr" | "it";
	levels: SidebarLevel[];
	/** Called after a navigation link is clicked (useful to close mobile drawer). */
	onNavigate?: () => void;
}

/**
 * Vertical navigation sidebar for a section (FR or IT).
 * Renders each level as a link with a progress badge.
 */
export function Sidebar({ section, levels, onNavigate }: SidebarProps) {
	return (
		<nav
			aria-label={
				section === "fr" ? "Navigation française" : "Navigazione italiana"
			}
			className="flex flex-col gap-1 px-2 py-4"
		>
			{levels.map((level) => {
				const to =
					level.slug === "theory"
						? `/${section}/theory`
						: `/${section}/${level.slug}`;

				const ids = level.ids ?? [];

				return (
					<Link
						key={level.slug}
						to={to}
						className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--c-fg)] no-underline transition-colors hover:bg-[var(--c-card)]"
						activeProps={{
							className:
								"flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--c-primary)] no-underline bg-[var(--c-card)]",
						}}
						onClick={onNavigate}
					>
						<span className="flex-1">{level.label}</span>
						{level.total > 0 && <ProgressBadge ids={ids} total={level.total} />}
					</Link>
				);
			})}
		</nav>
	);
}
