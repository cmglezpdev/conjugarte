import { Link, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { Language } from "#/content/schema";
import { getSectionMeta, type LevelGroup } from "#/lib/sections";
import { Flag } from "./Flag";
import { ProgressBadge } from "./ProgressBadge";

interface SidebarProps {
	section: Language;
	/** Called after a navigation link is clicked (useful to close mobile drawer). */
	onNavigate?: () => void;
}

/**
 * Vertical navigation sidebar for a section (FR or IT).
 * - Theory is a flat link.
 * - Each level is an accordion with two sub-options: Exercises and Control.
 * - The accordion auto-expands when the current pathname is inside the group.
 */
export function Sidebar({ section, onNavigate }: SidebarProps) {
	const meta = useMemo(() => getSectionMeta(section), [section]);
	const { pathname } = useLocation();

	// Compute which level the user is currently inside (if any). The accordion
	// for that level should be open by default.
	const activeLevelSlug = useMemo(() => {
		for (const group of meta.levels) {
			if (
				pathname === group.exercises.path ||
				pathname.startsWith(`${group.exercises.path}/`)
			) {
				return group.slug;
			}
		}
		return null;
	}, [meta.levels, pathname]);

	// Track expanded state per level. The active group is open by default; the
	// user can toggle others manually.
	const [openLevels, setOpenLevels] = useState<Set<string>>(
		() => new Set(activeLevelSlug ? [activeLevelSlug] : []),
	);

	// Keep the active level open when the route changes.
	useEffect(() => {
		if (activeLevelSlug) {
			setOpenLevels((prev) => {
				if (prev.has(activeLevelSlug)) return prev;
				const next = new Set(prev);
				next.add(activeLevelSlug);
				return next;
			});
		}
	}, [activeLevelSlug]);

	const toggleLevel = (slug: string) => {
		setOpenLevels((prev) => {
			const next = new Set(prev);
			if (next.has(slug)) next.delete(slug);
			else next.add(slug);
			return next;
		});
	};

	const navAriaLabel =
		section === "fr" ? "Navigation française" : "Navigazione italiana";

	return (
		<nav aria-label={navAriaLabel} className="flex flex-col gap-1 px-2 py-4">
			<div className="mb-2 flex items-center gap-2 px-3 pb-2 border-b border-[var(--c-border)]">
				<Flag section={section} size={22} />
				<span className="font-display text-sm font-bold text-[var(--c-primary)]">
					{meta.label}
				</span>
			</div>

			{/* Theory — flat link */}
			<Link
				to={meta.theory.path}
				className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--c-fg)] no-underline transition-colors hover:bg-[var(--c-card)]"
				activeProps={{
					className:
						"flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--c-primary)] no-underline bg-[var(--c-card)]",
				}}
				onClick={onNavigate}
			>
				<span className="flex-1">{meta.theory.label}</span>
			</Link>

			{/* Each level — accordion with Exercises + Control */}
			{meta.levels.map((group) => (
				<LevelAccordion
					key={group.slug}
					group={group}
					expanded={openLevels.has(group.slug)}
					onToggle={() => toggleLevel(group.slug)}
					onNavigate={onNavigate}
				/>
			))}
		</nav>
	);
}

// -----------------------------------------------------------------------
// LevelAccordion
// -----------------------------------------------------------------------

interface LevelAccordionProps {
	group: LevelGroup;
	expanded: boolean;
	onToggle: () => void;
	onNavigate?: () => void;
}

function LevelAccordion({
	group,
	expanded,
	onToggle,
	onNavigate,
}: LevelAccordionProps) {
	const totalIds = useMemo(
		() => [...group.exercises.ids, ...group.control.ids],
		[group.exercises.ids, group.control.ids],
	);
	const totalCount = group.exercises.count + group.control.count;
	const panelId = `level-panel-${group.slug}`;

	return (
		<div className="flex flex-col">
			<button
				type="button"
				aria-expanded={expanded}
				aria-controls={panelId}
				onClick={onToggle}
				className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[var(--c-fg)] transition-colors hover:bg-[var(--c-card)] focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
			>
				<ChevronIcon expanded={expanded} />
				<span className="flex-1">{group.heading}</span>
				<ProgressBadge ids={totalIds} total={totalCount} />
			</button>

			<AnimatePresence initial={false}>
				{expanded && (
					<motion.div
						key={panelId}
						id={panelId}
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div className="ml-4 mt-1 flex flex-col gap-1 border-l border-[var(--c-border)] pl-3">
							<SubLink
								to={group.exercises.path}
								label={group.exercises.label}
								ids={group.exercises.ids}
								total={group.exercises.count}
								onNavigate={onNavigate}
							/>
							<SubLink
								to={group.control.path}
								label={group.control.label}
								ids={group.control.ids}
								total={group.control.count}
								onNavigate={onNavigate}
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// -----------------------------------------------------------------------
// SubLink
// -----------------------------------------------------------------------

interface SubLinkProps {
	to: string;
	label: string;
	ids: string[];
	total: number;
	onNavigate?: () => void;
}

function SubLink({ to, label, ids, total, onNavigate }: SubLinkProps) {
	return (
		<Link
			to={to}
			className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--c-fg)] no-underline transition-colors hover:bg-[var(--c-card)]"
			activeProps={{
				className:
					"flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[var(--c-primary)] no-underline bg-[var(--c-card)]",
			}}
			onClick={onNavigate}
		>
			<span className="flex-1">{label}</span>
			<ProgressBadge ids={ids} total={total} />
		</Link>
	);
}

// -----------------------------------------------------------------------
// ChevronIcon — rotates 90° when expanded
// -----------------------------------------------------------------------

function ChevronIcon({ expanded }: { expanded: boolean }) {
	return (
		<motion.svg
			aria-hidden="true"
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			animate={{ rotate: expanded ? 90 : 0 }}
			transition={{ duration: 0.18, ease: "easeInOut" }}
			className="shrink-0 text-[var(--c-accent)]"
		>
			<path d="M4 2l4 4-4 4" />
		</motion.svg>
	);
}
