import { motion } from "motion/react";
import { useReducer } from "react";
import type { ChoiceExercise } from "#/content/schema";
import { ContextHint } from "./_shared/ContextHint";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

// For single: selections[itemIdx] = number | null
// For multiple: selections[itemIdx] = Set<number> (stored as number[])
type SingleSelections = Record<number, number | null>;
type MultiSelections = Record<number, number[]>;

interface SingleState {
	status: ExerciseStatus;
	mode: "single";
	selections: SingleSelections;
}

interface MultiState {
	status: ExerciseStatus;
	mode: "multiple";
	selections: MultiSelections;
}

type State = SingleState | MultiState;

type Action =
	| { type: "select-single"; itemIdx: number; optionIdx: number }
	| { type: "toggle-multi"; itemIdx: number; optionIdx: number }
	| { type: "submit"; outcome: "correct" | "incorrect" | "partial" }
	| { type: "reset" };

function makeSingleInitial(itemCount: number): SingleState {
	const selections: SingleSelections = {};
	for (let i = 0; i < itemCount; i++) selections[i] = null;
	return { status: "idle", mode: "single", selections };
}

function makeMultiInitial(itemCount: number): MultiState {
	const selections: MultiSelections = {};
	for (let i = 0; i < itemCount; i++) selections[i] = [];
	return { status: "idle", mode: "multiple", selections };
}

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "select-single": {
			if (state.mode !== "single") return state;
			return {
				...state,
				status: "answering",
				selections: {
					...state.selections,
					[action.itemIdx]: action.optionIdx,
				},
			};
		}
		case "toggle-multi": {
			if (state.mode !== "multiple") return state;
			const current = state.selections[action.itemIdx] ?? [];
			const next = current.includes(action.optionIdx)
				? current.filter((i) => i !== action.optionIdx)
				: [...current, action.optionIdx];
			return {
				...state,
				status: "answering",
				selections: { ...state.selections, [action.itemIdx]: next },
			};
		}
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			if (state.mode === "single")
				return makeSingleInitial(Object.keys(state.selections).length);
			return makeMultiInitial(Object.keys(state.selections).length);
	}
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function arraysEqualSorted(a: number[], b: number[]): boolean {
	if (a.length !== b.length) return false;
	const sa = [...a].sort((x, y) => x - y);
	const sb = [...b].sort((x, y) => x - y);
	return sa.every((v, i) => v === sb[i]);
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

export interface ChoiceResult {
	score: number;
	correct: boolean;
}

interface Props {
	exercise: ChoiceExercise;
	onResult: (result: ChoiceResult) => void;
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

export function Choice({ exercise, onResult, onNext }: Props) {
	const itemCount = exercise.items.length;
	const initialState: State = exercise.multiple
		? makeMultiInitial(itemCount)
		: makeSingleInitial(itemCount);

	const [state, dispatch] = useReducer(reducer, initialState);

	const isSubmitted =
		state.status === "correct" ||
		state.status === "incorrect" ||
		state.status === "partial";

	// Verify is blocked until every item has at least one selection — this
	// prevents the "show correct answers without trying" loophole and matches
	// standard quiz UX.
	const allAnswered = exercise.items.every((_, itemIdx) => {
		if (state.mode === "single") {
			return (
				state.selections[itemIdx] !== null &&
				state.selections[itemIdx] !== undefined
			);
		}
		return (state.selections[itemIdx] ?? []).length > 0;
	});

	const handleVerify = () => {
		let totalItems = 0;
		let correctItems = 0;

		for (const [itemIdx, item] of exercise.items.entries()) {
			totalItems++;
			const correctArr = Array.isArray(item.correct)
				? item.correct
				: [item.correct];

			if (state.mode === "single") {
				const selected = state.selections[itemIdx] ?? null;
				if (selected !== null && correctArr.includes(selected)) correctItems++;
			} else {
				const selected = state.selections[itemIdx] ?? [];
				if (arraysEqualSorted(selected, correctArr)) correctItems++;
			}
		}

		const score = totalItems === 0 ? 0 : correctItems / totalItems;
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
			<ContextHint text={exercise.contextHint} />
			<motion.div
				animate={isSubmitted ? state.status : "idle"}
				// biome-ignore lint/suspicious/noExplicitAny: motion variants typing
				variants={shakeVariants as any}
				key={animateKey}
				className="space-y-6"
			>
				{exercise.items.map((item, itemIdx) => {
					const correctArr = Array.isArray(item.correct)
						? item.correct
						: [item.correct];

					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: stable positional items
						<div key={itemIdx} className="space-y-3">
							<p className="font-medium text-[var(--c-fg)]">{item.prompt}</p>
							<div className="space-y-2">
								{item.options.map((option, optIdx) => {
									const isSelected =
										state.mode === "single"
											? state.selections[itemIdx] === optIdx
											: (state.selections[itemIdx] ?? []).includes(optIdx);
									const isCorrectOption = correctArr.includes(optIdx);

									let optionClass =
										"flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-colors ";

									if (isSubmitted) {
										if (isCorrectOption) {
											optionClass +=
												"border-[var(--c-correct)] bg-[var(--c-correct)]/10 text-[var(--c-fg)]";
										} else if (isSelected && !isCorrectOption) {
											optionClass +=
												"border-[var(--c-incorrect)] bg-[var(--c-incorrect)]/10 text-[var(--c-fg)]";
										} else {
											optionClass +=
												"border-[var(--c-border)] bg-[var(--c-card)] text-[var(--c-fg)] opacity-50";
										}
									} else if (isSelected) {
										optionClass +=
											"border-[var(--c-primary)] bg-[var(--c-primary)]/10 text-[var(--c-fg)]";
									} else {
										optionClass +=
											"border-[var(--c-border)] bg-[var(--c-card)] text-[var(--c-fg)] hover:border-[var(--c-primary)]";
									}

									return (
										<motion.button
											key={`opt-${optIdx}`}
											type="button"
											// motion.button: aria-checked on role=radio/checkbox is valid
											role={exercise.multiple ? "checkbox" : "radio"}
											data-testid={`choice-option-${itemIdx}-${optIdx}`}
											className={optionClass}
											aria-checked={isSelected}
											disabled={isSubmitted}
											whileHover={
												!isSubmitted
													? { y: -1, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }
													: {}
											}
											transition={{ duration: 0.15 }}
											onClick={() => {
												if (exercise.multiple) {
													dispatch({
														type: "toggle-multi",
														itemIdx,
														optionIdx: optIdx,
													});
												} else {
													dispatch({
														type: "select-single",
														itemIdx,
														optionIdx: optIdx,
													});
												}
											}}
										>
											<span
												className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-${exercise.multiple ? "sm" : "full"} border text-xs ${
													isSelected
														? "border-[var(--c-primary)] bg-[var(--c-primary)] text-white"
														: "border-[var(--c-border)]"
												}`}
											>
												{isSelected && "✓"}
											</span>
											<span>{option}</span>
										</motion.button>
									);
								})}
							</div>
						</div>
					);
				})}
			</motion.div>
		</ExerciseCard>
	);
}
