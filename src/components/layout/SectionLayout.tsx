import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useProgress } from "#/stores/progress";
import ConjugArteHeader from "./ConjugArteHeader";
import { Sidebar, type SidebarLevel } from "./Sidebar";

// -----------------------------------------------------------------------
// Exercise ID generation — mirrors content/{lang}/{level}[-control].json
// IDs follow the pattern: {lang}-{level}[-control]-{N}
// Counts are hardcoded from the validated content files.
// -----------------------------------------------------------------------

function makeIds(
	lang: string,
	level: string,
	isControl: boolean,
	count: number,
): string[] {
	const suffix = isControl ? `-control` : "";
	return Array.from(
		{ length: count },
		(_, i) => `${lang}-${level}${suffix}-${i + 1}`,
	);
}

function buildLevels(section: "fr" | "it"): SidebarLevel[] {
	return [
		{
			slug: "theory",
			label: section === "fr" ? "À contretemps" : "Questione di forme",
			total: 0,
			ids: [],
		},
		{
			slug: "basic",
			label: section === "fr" ? "À toi le temps!" : "Fai parlare il tempo!",
			total: 17,
			ids: makeIds(section, "basic", false, 17),
		},
		{
			slug: "basic-control",
			label: section === "fr" ? "Le temps juste" : "Il tempo giusto",
			total: 4,
			ids: makeIds(section, "basic", true, 4),
		},
		{
			slug: "intermediate",
			label: section === "fr" ? "Le bon moment" : "Il momento giusto",
			total: 15,
			ids: makeIds(section, "intermediate", false, 15),
		},
		{
			slug: "intermediate-control",
			label: section === "fr" ? "À la minute" : "Al minuto",
			total: 4,
			ids: makeIds(section, "intermediate", true, 4),
		},
		{
			slug: "advanced",
			label: section === "fr" ? "Maître du temps" : "Maestro del tempo",
			total: 13,
			ids: makeIds(section, "advanced", false, 13),
		},
		{
			slug: "advanced-control",
			label: section === "fr" ? "Chrono final" : "Finale a cronometro",
			total: 4,
			ids: makeIds(section, "advanced", true, 4),
		},
	];
}

// -----------------------------------------------------------------------
// ResetSectionButton
// -----------------------------------------------------------------------

interface ResetSectionButtonProps {
	section: "fr" | "it";
}

function ResetSectionButton({ section }: ResetSectionButtonProps) {
	const resetSection = useProgress((s) => s.resetSection);
	const [confirming, setConfirming] = useState(false);

	if (confirming) {
		return (
			<div className="px-2 py-3 space-y-2">
				<p className="text-xs text-[var(--c-fg)] opacity-70">
					{section === "fr"
						? "¿Reiniciar todo el progreso de Français?"
						: "¿Reiniciar todo el progreso de Italiano?"}
				</p>
				<div className="flex gap-2">
					<button
						type="button"
						className="flex-1 rounded-md bg-[var(--c-incorrect)] px-2 py-1.5 text-xs font-semibold text-white focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
						onClick={() => {
							resetSection(section);
							setConfirming(false);
						}}
					>
						Sí, reiniciar
					</button>
					<button
						type="button"
						className="flex-1 rounded-md border border-[var(--c-border)] px-2 py-1.5 text-xs text-[var(--c-fg)] focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
						onClick={() => setConfirming(false)}
					>
						Cancelar
					</button>
				</div>
			</div>
		);
	}

	return (
		<button
			type="button"
			className="mx-2 mt-2 w-[calc(100%-1rem)] rounded-lg border border-[var(--c-border)] px-3 py-2 text-left text-xs text-[var(--c-accent)] transition-colors hover:border-[var(--c-incorrect)] hover:text-[var(--c-incorrect)] focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
			onClick={() => setConfirming(true)}
		>
			Reiniciar progreso
		</button>
	);
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

interface SectionLayoutProps {
	section: "fr" | "it";
	pathname: string;
	children: React.ReactNode;
}

/**
 * Shell layout for the FR and IT sections.
 * Renders the app header, a sidebar on the left, and the outlet on the right.
 * On mobile (< md) the sidebar is toggled via a hamburger button.
 */
export function SectionLayout({
	section,
	pathname,
	children,
}: SectionLayoutProps) {
	const levels = buildLevels(section);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="flex min-h-screen flex-col">
			<ConjugArteHeader section={section} />

			<div className="flex flex-1 relative">
				{/* ---- Desktop sidebar ---- */}
				<aside className="hidden w-64 shrink-0 border-r border-[var(--c-border)] md:flex md:flex-col">
					<Sidebar section={section} levels={levels} />
					<div className="mt-auto border-t border-[var(--c-border)] pb-4">
						<ResetSectionButton section={section} />
					</div>
				</aside>

				{/* ---- Mobile sidebar overlay ---- */}
				<AnimatePresence>
					{sidebarOpen && (
						<>
							{/* Backdrop */}
							<motion.div
								key="backdrop"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
								className="fixed inset-0 z-30 bg-black/40 md:hidden"
								onClick={() => setSidebarOpen(false)}
								aria-hidden="true"
							/>
							{/* Drawer */}
							<motion.aside
								key="drawer"
								initial={{ x: "-100%" }}
								animate={{ x: 0 }}
								exit={{ x: "-100%" }}
								transition={{ duration: 0.25, ease: "easeInOut" }}
								className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--c-border)] bg-[var(--c-bg)] md:hidden"
							>
								<div className="flex items-center justify-between border-b border-[var(--c-border)] px-4 py-3">
									<span className="font-display text-sm font-bold text-[var(--c-primary)]">
										{section === "fr" ? "Français" : "Italiano"}
									</span>
									<button
										type="button"
										aria-label="Cerrar menú"
										className="rounded-md p-1.5 text-[var(--c-fg)] hover:bg-[var(--c-card)] focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
										onClick={() => setSidebarOpen(false)}
									>
										<svg
											aria-hidden="true"
											width="16"
											height="16"
											viewBox="0 0 16 16"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
										>
											<path d="M2 2l12 12M14 2L2 14" />
										</svg>
									</button>
								</div>
								<div className="flex-1 overflow-y-auto">
									<Sidebar
										section={section}
										levels={levels}
										onNavigate={() => setSidebarOpen(false)}
									/>
								</div>
								<div className="border-t border-[var(--c-border)] pb-4">
									<ResetSectionButton section={section} />
								</div>
							</motion.aside>
						</>
					)}
				</AnimatePresence>

				{/* ---- Main content ---- */}
				<div className="flex flex-1 flex-col min-w-0">
					{/* Mobile nav bar */}
					<div className="flex items-center gap-2 border-b border-[var(--c-border)] px-4 py-2 md:hidden">
						<button
							type="button"
							aria-label="Abrir menú de navegación"
							aria-expanded={sidebarOpen}
							className="rounded-md p-1.5 text-[var(--c-fg)] hover:bg-[var(--c-card)] focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
							onClick={() => setSidebarOpen(true)}
						>
							<svg
								aria-hidden="true"
								width="18"
								height="18"
								viewBox="0 0 18 18"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							>
								<line x1="2" y1="4" x2="16" y2="4" />
								<line x1="2" y1="9" x2="16" y2="9" />
								<line x1="2" y1="14" x2="16" y2="14" />
							</svg>
						</button>
						<span className="text-sm font-medium text-[var(--c-fg)]">
							{section === "fr" ? "Français" : "Italiano"}
						</span>
					</div>

					<main className="flex-1 overflow-auto px-6 py-8">
						{/* Route transition — key on pathname so AnimatePresence detects change */}
						<AnimatePresence mode="wait">
							<motion.div
								key={pathname}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{ duration: 0.2, ease: "easeInOut" }}
							>
								{children}
							</motion.div>
						</AnimatePresence>
					</main>
				</div>
			</div>

			{/* ---- Footer ---- */}
			<footer className="border-t border-[var(--c-border)] px-6 py-4 text-center text-xs text-[var(--c-accent)]">
				ConjugArte — Tesis 2025 ·{" "}
				<a
					href="https://github.com/cmglezpdev/conjugarte"
					target="_blank"
					rel="noopener noreferrer"
					className="underline underline-offset-2 hover:text-[var(--c-primary)] transition-colors"
				>
					Código fuente
				</a>
			</footer>
		</div>
	);
}
