import { Link } from "@tanstack/react-router";

const SECTION_LABELS: Record<string, string> = {
	fr: "Français",
	it: "Italiano",
};

interface ConjugArteHeaderProps {
	/** Active section, if any. Shown as a breadcrumb beside the logo. */
	section?: "fr" | "it";
}

/**
 * App-specific header for ConjugArte.
 * Shows the brand logo/title linking to `/`.
 * When `section` is provided, shows a subtle breadcrumb: "ConjugArte / Français".
 */
export default function ConjugArteHeader({ section }: ConjugArteHeaderProps) {
	return (
		<header className="sticky top-0 z-50 border-b border-[var(--c-border)] bg-[color-mix(in_oklab,var(--c-bg)_85%,transparent)] px-4 backdrop-blur-lg">
			<div className="mx-auto flex max-w-screen-xl items-center gap-2 py-3">
				<Link
					to="/"
					className="font-display text-xl font-bold tracking-tight text-[var(--c-primary)] no-underline hover:opacity-80"
				>
					ConjugArte
				</Link>
				{section && (
					<>
						<span
							className="text-[var(--c-border)] select-none"
							aria-hidden="true"
						>
							/
						</span>
						<span className="text-sm font-medium text-[var(--c-accent)]">
							{SECTION_LABELS[section]}
						</span>
					</>
				)}
			</div>
		</header>
	);
}
