import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ExerciseResult } from "#/components/exercises/ExerciseRenderer";
import { ExerciseRenderer } from "#/components/exercises/ExerciseRenderer";
import type { Exercise, ExerciseSet } from "#/content/schema";
import { useProgress } from "#/stores/progress";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

interface LevelRunnerProps {
	exercises: Exercise[];
	levelTitle: string;
	onLevelComplete?: () => void;
}

// -----------------------------------------------------------------------
// Summary screen
// -----------------------------------------------------------------------

function LevelSummary({
	total,
	completed,
	onRestart,
}: {
	total: number;
	completed: number;
	onRestart: () => void;
}) {
	const allCorrect = completed === total;

	return (
		<motion.div
			data-testid="level-summary"
			initial={{ scale: 0.9, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ type: "spring", stiffness: 260, damping: 20 }}
			className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-xl border border-[var(--c-border)] bg-[var(--c-card)] p-10 text-center shadow"
		>
			<motion.span
				className="text-5xl"
				aria-hidden="true"
				animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
				transition={{ duration: 0.6, delay: 0.3 }}
			>
				{allCorrect ? "🎉" : "📝"}
			</motion.span>
			<h2 className="text-2xl font-bold text-[var(--c-fg)]">
				{allCorrect ? "¡Nivel completado!" : "¡Sesión terminada!"}
			</h2>
			<p className="text-[var(--c-accent)]">
				Completaste{" "}
				<span className="font-semibold text-[var(--c-fg)]">{completed}</span> de{" "}
				<span className="font-semibold text-[var(--c-fg)]">{total}</span>{" "}
				ejercicios correctamente.
			</p>
			<button
				type="button"
				onClick={onRestart}
				className="rounded-lg border border-[var(--c-primary)] bg-[var(--c-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--c-primary-fg)] transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]"
			>
				Volver al inicio del nivel
			</button>
		</motion.div>
	);
}

// -----------------------------------------------------------------------
// LevelRunner
// -----------------------------------------------------------------------

export function LevelRunner({
	exercises,
	levelTitle,
	onLevelComplete,
}: LevelRunnerProps) {
	const [currentIdx, setCurrentIdx] = useState(0);
	const [done, setDone] = useState(false);
	const [correctCount, setCorrectCount] = useState(0);

	const total = exercises.length;
	const current = exercises[currentIdx];

	const handleComplete = (result: ExerciseResult) => {
		// Record result in progress store immediately when result is known
		if (current) {
			useProgress.getState().recordResult(current.id, result.score);
		}
		if (result.correct) {
			setCorrectCount((n) => n + 1);
		}
	};

	const handleNext = () => {
		if (currentIdx + 1 >= total) {
			setDone(true);
			onLevelComplete?.();
		} else {
			setCurrentIdx((i) => i + 1);
		}
	};

	const handleRestart = () => {
		setCurrentIdx(0);
		setDone(false);
		setCorrectCount(0);
	};

	if (done) {
		return (
			<LevelSummary
				total={total}
				completed={correctCount}
				onRestart={handleRestart}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold text-[var(--c-fg)]">
					{levelTitle}
				</h1>
				{/* Animated counter — re-mounts on currentIdx change to trigger animation */}
				<AnimatePresence mode="wait">
					<motion.span
						key={currentIdx}
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 6 }}
						transition={{ duration: 0.2 }}
						className="text-sm font-medium tabular-nums text-[var(--c-accent)]"
					>
						{currentIdx + 1}/{total}
					</motion.span>
				</AnimatePresence>
			</div>

			{/* Exercise */}
			<AnimatePresence mode="wait">
				{current && (
					<motion.div
						key={current.id}
						initial={{ x: 50, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: -50, opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
					>
						<ExerciseRenderer
							exercise={current}
							onComplete={handleComplete}
							onNext={handleNext}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// Re-export a convenience wrapper that takes an ExerciseSet
export function LevelRunnerFromSet({
	exerciseSet,
	onLevelComplete,
}: {
	exerciseSet: ExerciseSet;
	onLevelComplete?: () => void;
}) {
	return (
		<LevelRunner
			exercises={exerciseSet.exercises}
			levelTitle={exerciseSet.title}
			onLevelComplete={onLevelComplete}
		/>
	);
}
