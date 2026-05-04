import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import type { Landing } from "#/content/schema";
import { Flag } from "./Flag";

type Lang = "es" | "fr" | "it";

interface LandingHeroProps {
	data: Landing;
}

const LANG_LABELS: Record<Lang, string> = {
	es: "Español",
	fr: "Français",
	it: "Italiano",
};

export function LandingHero({ data }: LandingHeroProps) {
	const [activeLang, setActiveLang] = useState<Lang>("es");

	return (
		<motion.section
			className="flex flex-col items-center gap-10 px-4 py-16 text-center"
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
		>
			<motion.h1
				className="font-display text-5xl font-bold tracking-tight text-[var(--c-primary)] sm:text-7xl"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
			>
				ConjugArte
			</motion.h1>

			{/* Language toggle tabs */}
			<motion.div
				className="flex gap-2 rounded-full border border-[var(--c-border)] bg-[var(--c-card)] p-1"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
			>
				{(["es", "fr", "it"] as Lang[]).map((lang) => (
					<button
						key={lang}
						type="button"
						onClick={() => setActiveLang(lang)}
						className={[
							"rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-200",
							activeLang === lang
								? "bg-[var(--c-primary)] text-[var(--c-primary-fg)]"
								: "text-[var(--c-fg)] hover:bg-[var(--c-border)]",
						].join(" ")}
					>
						{LANG_LABELS[lang]}
					</button>
				))}
			</motion.div>

			{/* Description text with animated transition */}
			<motion.div
				className="max-w-2xl"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
			>
				<AnimatePresence mode="wait">
					<motion.div
						key={activeLang}
						className="text-base leading-relaxed text-[var(--c-fg)] sm:text-lg"
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.2 }}
					>
						{data[activeLang]}
					</motion.div>
				</AnimatePresence>
			</motion.div>

			{/* CTA buttons */}
			<motion.div
				className="flex flex-col gap-4 sm:flex-row"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
			>
				<Button
					asChild
					size="lg"
					className="min-w-48 bg-[var(--c-primary)] text-[var(--c-primary-fg)] hover:opacity-90"
				>
					<Link to="/fr">
						<Flag section="fr" size={24} className="mr-2" />
						Français
					</Link>
				</Button>

				<Button
					asChild
					size="lg"
					variant="outline"
					className="min-w-48 border-[var(--c-primary)] text-[var(--c-primary)] hover:bg-[var(--c-primary)] hover:text-[var(--c-primary-fg)]"
				>
					<Link to="/it">
						<Flag section="it" size={24} className="mr-2" />
						Italiano
					</Link>
				</Button>
			</motion.div>
		</motion.section>
	);
}
