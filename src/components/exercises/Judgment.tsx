import { motion } from "motion/react";
import { useReducer } from "react";
import type { JudgmentExercise } from "#/content/schema";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

// judgments[itemIdx] = true (Posible) | false (Imposible) | null (not set)
type Judgments = Record<number, boolean | null>;

interface State {
	status: ExerciseStatus;
	judgments: Judgments;
}

type Action =
	| { type: "judge"; itemIdx: number; value: boolean }
	| { type: "submit"; outcome: "correct" | "incorrect" | "partial" }
	| { type: "reset" };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "judge":
			return {
				...state,
				status: "answering",
				judgments: { ...state.judgments, [action.itemIdx]: action.value },
			};
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			return { status: "idle", judgments: {} };
	}
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

export interface JudgmentResult {
	score: number;
	correct: boolean;
}

interface Props {
	exercise: JudgmentExercise;
	onResult: (result: JudgmentResult) => void;
	onNext: () => void;
}

// -----------------------------------------------------------------------
// Motion variants
// -----------------------------------------------------------------------

const shakeVariants = {
	incorrect: {
		x: [0, -8, 8, -6, 6, -4, 4, 0],
		transition: { duration: 0.4, ease: "easeInOut" },
	},
	correct: {
		scale: [1, 1.03, 1],
		transition: { duration: 0.3, ease: "easeInOut" },
	},
	partial: {},
	idle: {},
	answering: {},
	submitted: {},
};

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function Judgment({ exercise, onResult, onNext }: Props) {
	const [state, dispatch] = useReducer(reducer, {
		status: "idle",
		judgments: {},
	});

	const isSubmitted =
		state.status === "correct" ||
		state.status === "incorrect" ||
		state.status === "partial";

	// Block verification until every sentence has been judged.
	const allAnswered = exercise.items.every((_, itemIdx) => {
		const j = state.judgments[itemIdx];
		return j === true || j === false;
	});

	const handleVerify = () => {
		const total = exercise.items.length;
		let correct = 0;
		for (const [itemIdx, item] of exercise.items.entries()) {
			const judgment = state.judgments[itemIdx] ?? null;
			if (judgment === item.possible) correct++;
		}
		const score = total === 0 ? 0 : correct / total;
		const outcome: "correct" | "incorrect" | "partial" =
			score >= 1 ? "correct" : score === 0 ? "incorrect" : "partial";
		dispatch({ type: "submit", outcome });
		onResult({ score, correct: score >= 1 });
	};

	const animateKey = isSubmitted ? state.status : "idle";

	return (
		<ExerciseCard
			title={exercise.title}
			instructions={exercise.instructions}
			status={state.status}
			footer={
				<div className="space-y-2">
					<FeedbackOverlay status={state.status} />
					<VerifyButton
						status={state.status}
						onVerify={handleVerify}
						onNext={onNext}
						disabled={!allAnswered}
					/>
				</div>
			}
		>
			<motion.div
				animate={isSubmitted ? state.status : "idle"}
				// biome-ignore lint/suspicious/noExplicitAny: motion variants typing
				variants={shakeVariants as any}
				key={animateKey}
				className="space-y-4"
			>
				{exercise.items.map((item, itemIdx) => {
					const selected = state.judgments[itemIdx] ?? null;
					const isItemCorrect = isSubmitted && selected === item.possible;

					return (
						<div
							key={`item-${itemIdx}`}
							className={`flex flex-col gap-3 rounded-lg border p-4 transition-colors ${
								isSubmitted
									? isItemCorrect
										? "border-[var(--c-correct)] bg-[var(--c-correct)]/5"
										: "border-[var(--c-incorrect)] bg-[var(--c-incorrect)]/5"
									: "border-[var(--c-border)] bg-[var(--c-card)]"
							}`}
						>
							<p className="text-[var(--c-fg)]">{item.sentence}</p>
							<div className="flex gap-3">
								{/* Posible button */}
								<button
									type="button"
									data-testid={`judgment-posible-${itemIdx}`}
									aria-pressed={selected === true}
									disabled={isSubmitted}
									onClick={() =>
										dispatch({ type: "judge", itemIdx, value: true })
									}
									className={`flex-1 rounded-lg border px-4 py-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--c-primary)] ${
										selected === true
											? "border-[var(--c-correct)] bg-[var(--c-correct)] text-white"
											: "border-[var(--c-border)] bg-[var(--c-card)] text-[var(--c-fg)] hover:border-[var(--c-correct)] disabled:cursor-not-allowed disabled:opacity-50"
									}`}
								>
									✓ Posible
								</button>
								{/* Imposible button */}
								<button
									type="button"
									data-testid={`judgment-imposible-${itemIdx}`}
									aria-pressed={selected === false}
									disabled={isSubmitted}
									onClick={() =>
										dispatch({ type: "judge", itemIdx, value: false })
									}
									className={`flex-1 rounded-lg border px-4 py-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--c-primary)] ${
										selected === false
											? "border-[var(--c-incorrect)] bg-[var(--c-incorrect)] text-white"
											: "border-[var(--c-border)] bg-[var(--c-card)] text-[var(--c-fg)] hover:border-[var(--c-incorrect)] disabled:cursor-not-allowed disabled:opacity-50"
									}`}
								>
									✗ Imposible
								</button>
							</div>
							{/* Post-verify: show correct answer */}
							{isSubmitted && (
								<p className="text-xs text-[var(--c-fg)] opacity-70">
									Respuesta correcta:{" "}
									<span className="font-semibold">
										{item.possible ? "Posible" : "Imposible"}
									</span>
								</p>
							)}
						</div>
					);
				})}
			</motion.div>
		</ExerciseCard>
	);
}
