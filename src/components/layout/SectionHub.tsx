import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { Language } from "#/content/schema";
import { getSectionMeta, type LevelEntry } from "#/lib/sections";
import { useProgress } from "#/stores/progress";
import { Flag } from "./Flag";

const INTRO: Record<Language, { title: string; body: string }> = {
	fr: {
		title: "Bienvenue dans l'espace français",
		body: "Travaillez les temps composés du français à votre rythme : commencez par la théorie, puis enchaînez avec les exercices par niveau. Chaque niveau propose des exercices d'entraînement et un contrôle final.",
	},
	it: {
		title: "Benvenuto nello spazio italiano",
		body: "Allenati con i tempi composti dell'italiano al tuo ritmo: inizia dalla teoria e prosegui con gli esercizi per livello. Ogni livello include esercizi di pratica e un controllo finale.",
	},
};

const THEORY_KICKER: Record<Language, string> = {
	fr: "Théorie",
	it: "Teoria",
};

const EXERCISES_KICKER: Record<Language, string> = {
	fr: "Exercices",
	it: "Esercizi",
};

const CONTROL_KICKER: Record<Language, string> = {
	fr: "Contrôle",
	it: "Controllo",
};

interface SectionHubProps {
	section: Language;
}

export function SectionHub({ section }: SectionHubProps) {
	const meta = getSectionMeta(section);
	const intro = INTRO[section];

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-10">
			{/* Hero */}
			<motion.section
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
				className="flex flex-col items-start gap-3"
			>
				<div className="flex items-center gap-3">
					<Flag section={section} size={32} />
					<h1 className="font-display text-3xl font-bold text-[var(--c-primary)] sm:text-4xl">
						{meta.label}
					</h1>
				</div>
				<h2 className="text-xl font-semibold text-[var(--c-fg)]">
					{intro.title}
				</h2>
				<p className="max-w-3xl text-sm leading-relaxed text-[var(--c-accent)] sm:text-base">
					{intro.body}
				</p>
			</motion.section>

			{/* Theory card */}
			<motion.section
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
			>
				<TheoryCard
					to={meta.theory.path}
					kicker={THEORY_KICKER[section]}
					label={meta.theory.label}
				/>
			</motion.section>

			{/* Levels grid */}
			<motion.section
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
				className="flex flex-col gap-4"
			>
				<h3 className="text-base font-semibold uppercase tracking-wider text-[var(--c-accent)]">
					{section === "fr" ? "Niveaux" : "Livelli"}
				</h3>
				<div className="grid gap-4 md:grid-cols-3">
					{meta.levels.map((group) => (
						<LevelCard
							key={group.slug}
							heading={group.heading}
							exercises={group.exercises}
							control={group.control}
							exercisesKicker={EXERCISES_KICKER[section]}
							controlKicker={CONTROL_KICKER[section]}
						/>
					))}
				</div>
			</motion.section>
		</div>
	);
}

// -----------------------------------------------------------------------
// TheoryCard
// -----------------------------------------------------------------------

interface TheoryCardProps {
	to: string;
	kicker: string;
	label: string;
}

function TheoryCard({ to, kicker, label }: TheoryCardProps) {
	return (
		<Link
			to={to}
			className="group flex items-center justify-between rounded-xl border border-[var(--c-border)] bg-[var(--c-card)] px-5 py-4 no-underline transition-all hover:-translate-y-0.5 hover:border-[var(--c-primary)] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
		>
			<div className="flex flex-col gap-0.5">
				<span className="text-xs font-semibold uppercase tracking-wider text-[var(--c-accent)]">
					{kicker}
				</span>
				<span className="font-display text-lg font-semibold text-[var(--c-fg)] group-hover:text-[var(--c-primary)]">
					{label}
				</span>
			</div>
			<ArrowIcon />
		</Link>
	);
}

// -----------------------------------------------------------------------
// LevelCard
// -----------------------------------------------------------------------

interface LevelCardProps {
	heading: string;
	exercises: LevelEntry;
	control: LevelEntry;
	exercisesKicker: string;
	controlKicker: string;
}

function LevelCard({
	heading,
	exercises,
	control,
	exercisesKicker,
	controlKicker,
}: LevelCardProps) {
	const allIds = [...exercises.ids, ...control.ids];
	const total = exercises.count + control.count;
	const completed = useProgress((state) => {
		let count = 0;
		for (const id of allIds) {
			if (state.byExerciseId[id]?.status === "completed") count++;
		}
		return count;
	});
	const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-[var(--c-border)] bg-[var(--c-card)] p-5 transition-shadow hover:shadow-md">
			<div className="flex items-baseline justify-between gap-3">
				<h4 className="font-display text-lg font-bold text-[var(--c-fg)]">
					{heading}
				</h4>
				<span
					className="text-xs font-semibold tabular-nums text-[var(--c-accent)]"
					title={`${completed} de ${total} ejercicios completados`}
				>
					{completed}/{total}
				</span>
			</div>

			{/* Mini progress bar */}
			<div
				className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--c-border)]"
				role="progressbar"
				aria-valuenow={pct}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`${pct}% completado`}
			>
				<div
					className="h-full rounded-full bg-[var(--c-primary)] transition-all"
					style={{ width: `${pct}%` }}
				/>
			</div>

			<div className="mt-2 flex flex-col gap-2">
				<Link
					to={exercises.path}
					className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm no-underline transition-colors hover:bg-[var(--c-bg)] focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
				>
					<div className="flex flex-col">
						<span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--c-accent)]">
							{exercisesKicker}
						</span>
						<span className="text-sm font-medium text-[var(--c-fg)] group-hover:text-[var(--c-primary)]">
							{exercises.label}
						</span>
					</div>
					<ArrowIcon size={14} />
				</Link>

				<Link
					to={control.path}
					className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm no-underline transition-colors hover:bg-[var(--c-bg)] focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
				>
					<div className="flex flex-col">
						<span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--c-accent)]">
							{controlKicker}
						</span>
						<span className="text-sm font-medium text-[var(--c-fg)] group-hover:text-[var(--c-primary)]">
							{control.label}
						</span>
					</div>
					<ArrowIcon size={14} />
				</Link>
			</div>
		</div>
	);
}

// -----------------------------------------------------------------------
// ArrowIcon
// -----------------------------------------------------------------------

function ArrowIcon({ size = 18 }: { size?: number }) {
	return (
		<svg
			aria-hidden="true"
			width={size}
			height={size}
			viewBox="0 0 18 18"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="shrink-0 text-[var(--c-accent)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--c-primary)]"
		>
			<line x1="3" y1="9" x2="14" y2="9" />
			<polyline points="9 4 14 9 9 14" />
		</svg>
	);
}
