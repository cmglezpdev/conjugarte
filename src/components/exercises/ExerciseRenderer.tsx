import { lazy, Suspense } from "react";
import type { Exercise } from "#/content/schema";
import { ExerciseCard } from "./_shared/ExerciseCard";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface ExerciseResult {
	score: number;
	correct: boolean;
}

export interface ExerciseRendererProps {
	exercise: Exercise;
	onComplete: (result: ExerciseResult) => void;
	onNext: () => void;
}

// -----------------------------------------------------------------------
// Lazy-loaded exercise components — each kind becomes a separate chunk.
// The `/* webpackChunkName */` hint is for webpack compat; Vite uses the
// file path as the chunk name automatically.
// -----------------------------------------------------------------------

const FillBlank = lazy(() =>
	import("./FillBlank").then((m) => ({ default: m.FillBlank })),
);
const InlineChoice = lazy(() =>
	import("./InlineChoice").then((m) => ({ default: m.InlineChoice })),
);
const Choice = lazy(() =>
	import("./Choice").then((m) => ({ default: m.Choice })),
);
const Judgment = lazy(() =>
	import("./Judgment").then((m) => ({ default: m.Judgment })),
);
const FreeText = lazy(() =>
	import("./FreeText").then((m) => ({ default: m.FreeText })),
);
const Anagram = lazy(() =>
	import("./Anagram").then((m) => ({ default: m.Anagram })),
);
const Reorder = lazy(() =>
	import("./Reorder").then((m) => ({ default: m.Reorder })),
);
const Categorize = lazy(() =>
	import("./Categorize").then((m) => ({ default: m.Categorize })),
);
const Match = lazy(() => import("./Match").then((m) => ({ default: m.Match })));
const AudioFill = lazy(() =>
	import("./AudioFill").then((m) => ({ default: m.AudioFill })),
);

// -----------------------------------------------------------------------
// Loading fallback — minimal skeleton inside the exercise card shell
// -----------------------------------------------------------------------

function ExerciseSkeleton() {
	return (
		<ExerciseCard title="" status="idle">
			<div className="space-y-3 animate-pulse">
				<div className="h-4 w-3/4 rounded bg-[var(--c-border)]" />
				<div className="h-4 w-1/2 rounded bg-[var(--c-border)]" />
				<div className="h-4 w-2/3 rounded bg-[var(--c-border)]" />
			</div>
		</ExerciseCard>
	);
}

// -----------------------------------------------------------------------
// Dispatcher
// -----------------------------------------------------------------------

export function ExerciseRenderer({
	exercise,
	onComplete,
	onNext,
}: ExerciseRendererProps) {
	return (
		<Suspense fallback={<ExerciseSkeleton />}>
			{(() => {
				switch (exercise.kind) {
					case "fill-blank":
						return (
							<FillBlank
								exercise={exercise}
								onResult={onComplete}
								onNext={onNext}
							/>
						);

					case "inline-choice":
						return (
							<InlineChoice
								exercise={exercise}
								onResult={onComplete}
								onNext={onNext}
							/>
						);

					case "choice":
						return (
							<Choice
								exercise={exercise}
								onResult={onComplete}
								onNext={onNext}
							/>
						);

					case "judgment":
						return (
							<Judgment
								exercise={exercise}
								onResult={onComplete}
								onNext={onNext}
							/>
						);

					case "free-text":
						return (
							<FreeText
								exercise={exercise}
								onResult={onComplete}
								onNext={onNext}
							/>
						);

					case "anagram":
						return (
							<Anagram
								exercise={exercise}
								onResult={onComplete}
								onNext={onNext}
							/>
						);

					case "reorder":
						return (
							<Reorder
								exercise={exercise}
								onResult={onComplete}
								onNext={onNext}
							/>
						);

					case "categorize":
						return (
							<Categorize
								exercise={exercise}
								onResult={onComplete}
								onNext={onNext}
							/>
						);

					case "match":
						return (
							<Match
								exercise={exercise}
								onResult={onComplete}
								onNext={onNext}
							/>
						);

					case "audio-fill":
						return (
							<AudioFill
								exercise={exercise}
								onResult={onComplete}
								onNext={onNext}
							/>
						);
				}
			})()}
		</Suspense>
	);
}
