import { motion } from "motion/react";
import { useReducer } from "react";
import type { FreeTextExercise } from "#/content/schema";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import { answersMatch } from "./_shared/normalize";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

type Inputs = Record<number, string>;

interface State {
	status: ExerciseStatus;
	inputs: Inputs;
}

type Action =
	| { type: "set"; itemIdx: number; value: string }
	| { type: "submit"; outcome: "correct" | "incorrect" | "partial" }
	| { type: "reset" };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "set":
			return {
				...state,
				status: "answering",
				inputs: { ...state.inputs, [action.itemIdx]: action.value },
			};
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			return { status: "idle", inputs: {} };
	}
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

export interface FreeTextResult {
	score: number;
	correct: boolean;
}

interface Props {
	exercise: FreeTextExercise;
	onResult: (result: FreeTextResult) => void;
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

export function FreeText({ exercise, onResult, onNext }: Props) {
	const [state, dispatch] = useReducer(reducer, {
		status: "idle",
		inputs: {},
	});

	const isSubmitted =
		state.status === "correct" ||
		state.status === "incorrect" ||
		state.status === "partial";

	// Per-item correctness for visual feedback
	const itemValidity: Record<number, boolean> = {};
	if (isSubmitted) {
		exercise.items.forEach((item, itemIdx) => {
			const userInput = state.inputs[itemIdx] ?? "";
			itemValidity[itemIdx] = answersMatch(userInput, item.accepted);
		});
	}

	const handleVerify = () => {
		const total = exercise.items.length;
		let correct = 0;
		for (const [itemIdx, item] of exercise.items.entries()) {
			const userInput = state.inputs[itemIdx] ?? "";
			if (answersMatch(userInput, item.accepted)) correct++;
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
			status={state.status}
			footer={
				<div className="space-y-2">
					<FeedbackOverlay status={state.status} />
					<VerifyButton
						status={state.status}
						onVerify={handleVerify}
						onNext={onNext}
					/>
				</div>
			}
		>
			<motion.div
				animate={isSubmitted ? state.status : "idle"}
				// biome-ignore lint/suspicious/noExplicitAny: motion variants typing
				variants={shakeVariants as any}
				key={animateKey}
				className="space-y-6"
			>
				{exercise.items.map((item, itemIdx) => {
					const isItemCorrect = itemValidity[itemIdx];
					let inputBorderClass = "border-[var(--c-border)]";
					if (isSubmitted) {
						inputBorderClass = isItemCorrect
							? "border-[var(--c-correct)]"
							: "border-[var(--c-incorrect)]";
					}

					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: stable positional items
						<div key={itemIdx} className="space-y-2">
							{/* Context hint (optional) */}
							{item.contextHint && (
								<p className="rounded-md border border-[var(--c-border)] bg-[var(--c-card)] px-3 py-2 text-sm text-[var(--c-fg)] opacity-80">
									{item.contextHint}
								</p>
							)}
							{/* Prompt */}
							<p className="font-medium text-[var(--c-fg)]">{item.prompt}</p>
							{/* Input */}
							<input
								type="text"
								data-testid={`free-text-input-${itemIdx}`}
								value={state.inputs[itemIdx] ?? ""}
								onChange={(e) =>
									dispatch({
										type: "set",
										itemIdx,
										value: e.target.value,
									})
								}
								disabled={isSubmitted}
								className={`w-full rounded-lg border px-4 py-2.5 text-[var(--c-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] disabled:cursor-not-allowed disabled:opacity-70 ${inputBorderClass}`}
								aria-label={`Respuesta ${itemIdx + 1}`}
							/>
							{/* Expected answer — shown after verify */}
							{isSubmitted && (
								<p
									data-testid={`free-text-expected-${itemIdx}`}
									className="text-sm text-[var(--c-fg)] opacity-70"
								>
									Respuesta esperada:{" "}
									<span className="font-semibold">{item.accepted[0]}</span>
								</p>
							)}
						</div>
					);
				})}
			</motion.div>
		</ExerciseCard>
	);
}
