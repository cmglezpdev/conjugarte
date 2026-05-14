import { motion } from "motion/react";
import { useReducer } from "react";
import type { InlineChoiceExercise } from "#/content/schema";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

// selections[itemIdx][choiceIdx] = selectedOptionIdx | null
type Selections = Record<number, Record<number, number | null>>;

interface State {
	status: ExerciseStatus;
	selections: Selections;
}

type Action =
	| { type: "select"; itemIdx: number; choiceIdx: number; optionIdx: number }
	| { type: "submit"; outcome: "correct" | "incorrect" | "partial" }
	| { type: "reset" };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "select": {
			const item = state.selections[action.itemIdx] ?? {};
			return {
				...state,
				status: "answering",
				selections: {
					...state.selections,
					[action.itemIdx]: { ...item, [action.choiceIdx]: action.optionIdx },
				},
			};
		}
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			return { status: "idle", selections: {} };
	}
}

// -----------------------------------------------------------------------
// Sentence renderer — splits text around {{N}} placeholders
// -----------------------------------------------------------------------

type Segment =
	| { type: "text"; text: string }
	| { type: "choice"; index: number };

function parseSentence(sentence: string): Segment[] {
	// sentence like "Il (est/a) parti" — placeholders are {{N}}
	const parts = sentence.split(/\{\{(\d+)\}\}/);
	const segments: Segment[] = [];
	for (let i = 0; i < parts.length; i++) {
		if (i % 2 === 0) {
			if (parts[i]) segments.push({ type: "text", text: parts[i] });
		} else {
			segments.push({ type: "choice", index: Number(parts[i]) });
		}
	}
	return segments;
}

function correctIndexes(correct: number | number[]): number[] {
	return Array.isArray(correct) ? correct : [correct];
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

export interface InlineChoiceResult {
	score: number;
	correct: boolean;
}

interface Props {
	exercise: InlineChoiceExercise;
	onResult: (result: InlineChoiceResult) => void;
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

export function InlineChoice({ exercise, onResult, onNext }: Props) {
	const [state, dispatch] = useReducer(reducer, {
		status: "idle",
		selections: {},
	});

	const isSubmitted =
		state.status === "correct" ||
		state.status === "incorrect" ||
		state.status === "partial";

	// Verify is blocked until every choice in every item is answered — this
	// prevents revealing the correct answers without the user attempting.
	const allAnswered = exercise.items.every((item, itemIdx) =>
		item.choices.every((_, choiceIdx) => {
			const selected = state.selections[itemIdx]?.[choiceIdx];
			return selected !== null && selected !== undefined;
		}),
	);

	// Per-choice correctness for visual feedback
	const choiceValidity: Record<number, Record<number, boolean>> = {};
	if (isSubmitted) {
		exercise.items.forEach((item, itemIdx) => {
			choiceValidity[itemIdx] = {};
			item.choices.forEach((choice, choiceIdx) => {
				const selected = state.selections[itemIdx]?.[choiceIdx] ?? null;
				choiceValidity[itemIdx][choiceIdx] =
					selected !== null && correctIndexes(choice.correct).includes(selected);
			});
		});
	}

	const handleVerify = () => {
		let total = 0;
		let correct = 0;
		for (const [itemIdx, item] of exercise.items.entries()) {
			for (const [choiceIdx, choice] of item.choices.entries()) {
				total++;
				const selected = state.selections[itemIdx]?.[choiceIdx] ?? null;
				if (selected !== null && correctIndexes(choice.correct).includes(selected))
					correct++;
			}
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
					const segments = parseSentence(item.sentence);

					return (
						<div key={`item-${itemIdx}`} className="leading-loose">
							{segments.map((seg, segIdx) => {
								if (seg.type === "text") {
									return <span key={`t-${segIdx}`}>{seg.text}</span>;
								}

								const choiceIdx = seg.index;
								const choice = item.choices[choiceIdx];
								if (!choice) return null;
								const selected = state.selections[itemIdx]?.[choiceIdx] ?? null;
								const isCorrect = choiceValidity[itemIdx]?.[choiceIdx];
								const correctArr = correctIndexes(choice.correct);

								return (
									<span
										key={`choice-${choiceIdx}`}
										className="inline-flex gap-1 flex-wrap mx-1"
									>
										{choice.options.map((option, optIdx) => {
											const isSelected = selected === optIdx;
											let pillClass =
												"rounded-full border px-3 py-0.5 text-sm font-medium transition-colors cursor-pointer ";

											if (isSubmitted) {
												if (correctArr.includes(optIdx)) {
													pillClass +=
														"border-[var(--c-correct)] bg-[var(--c-correct)] text-white";
												} else if (isSelected && !isCorrect) {
													pillClass +=
														"border-[var(--c-incorrect)] bg-[var(--c-incorrect)] text-white";
												} else {
													pillClass +=
														"border-[var(--c-border)] bg-[var(--c-card)] text-[var(--c-fg)] opacity-50";
												}
											} else if (isSelected) {
												pillClass +=
													"border-[var(--c-primary)] bg-[var(--c-primary)] text-white";
											} else {
												pillClass +=
													"border-[var(--c-border)] bg-[var(--c-card)] text-[var(--c-fg)] hover:border-[var(--c-primary)]";
											}

											return (
												<button
													key={`opt-${optIdx}`}
													type="button"
													data-testid={`inline-choice-option-${itemIdx}-${choiceIdx}-${optIdx}`}
													className={pillClass}
													aria-pressed={isSelected}
													disabled={isSubmitted}
													onClick={() =>
														dispatch({
															type: "select",
															itemIdx,
															choiceIdx,
															optionIdx: optIdx,
														})
													}
												>
													{option}
												</button>
											);
										})}
									</span>
								);
							})}
						</div>
					);
				})}
			</motion.div>
		</ExerciseCard>
	);
}
