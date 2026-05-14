import { useReducer } from "react";
import type { MatchFillExercise } from "#/content/schema";
import { ContextHint } from "./_shared/ContextHint";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import { answersMatch } from "./_shared/normalize";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

type Side = "left" | "right";
type Answers = Record<Side, Record<number, Record<number, string>>>;
type UserPairs = Record<number, number>;

interface State {
	status: ExerciseStatus;
	selectedLeft: number | null;
	userPairs: UserPairs;
	answers: Answers;
}

type Action =
	| { type: "select-left"; idx: number }
	| { type: "select-right"; idx: number }
	| { type: "unpair-left"; idx: number }
	| { type: "unpair-right"; idx: number }
	| {
			type: "set-answer";
			side: Side;
			itemIdx: number;
			blankIdx: number;
			value: string;
	  }
	| { type: "submit"; outcome: "correct" | "incorrect" | "partial" }
	| { type: "reset" };

function emptyAnswers(): Answers {
	return { left: {}, right: {} };
}

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "select-left":
			return {
				...state,
				status: "answering",
				selectedLeft: state.selectedLeft === action.idx ? null : action.idx,
			};
		case "select-right": {
			const leftIdx = state.selectedLeft;
			if (leftIdx === null) return state;

			const nextPairs: UserPairs = {};
			for (const [left, right] of Object.entries(state.userPairs)) {
				const currentLeft = Number(left);
				if (currentLeft !== leftIdx && right !== action.idx) {
					nextPairs[currentLeft] = right;
				}
			}
			nextPairs[leftIdx] = action.idx;

			return {
				...state,
				status: "answering",
				selectedLeft: null,
				userPairs: nextPairs,
			};
		}
		case "unpair-left": {
			const nextPairs = { ...state.userPairs };
			delete nextPairs[action.idx];
			return {
				...state,
				status: "answering",
				selectedLeft: null,
				userPairs: nextPairs,
			};
		}
		case "unpair-right": {
			const paired = Object.entries(state.userPairs).find(
				([, right]) => right === action.idx,
			);
			if (!paired) return state;
			const nextPairs = { ...state.userPairs };
			delete nextPairs[Number(paired[0])];
			return {
				...state,
				status: "answering",
				selectedLeft: null,
				userPairs: nextPairs,
			};
		}
		case "set-answer": {
			const sideAnswers = state.answers[action.side];
			const itemAnswers = sideAnswers[action.itemIdx] ?? {};
			return {
				...state,
				status: "answering",
				answers: {
					...state.answers,
					[action.side]: {
						...sideAnswers,
						[action.itemIdx]: {
							...itemAnswers,
							[action.blankIdx]: action.value,
						},
					},
				},
			};
		}
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			return {
				status: "idle",
				selectedLeft: null,
				userPairs: {},
				answers: emptyAnswers(),
			};
	}
}

type Segment =
	| { type: "text"; text: string }
	| { type: "blank"; index: number };

function parseSentence(sentence: string): Segment[] {
	const parts = sentence.split(/\{\{(\d+)\}\}/);
	const segments: Segment[] = [];
	for (let i = 0; i < parts.length; i++) {
		if (i % 2 === 0) {
			if (parts[i]) segments.push({ type: "text", text: parts[i] });
		} else {
			segments.push({ type: "blank", index: Number(parts[i]) });
		}
	}
	return segments;
}

function canonical(answer: string | string[]): string {
	return Array.isArray(answer) ? (answer[0] ?? "") : answer;
}

function filledSentence(item: MatchFillExercise["left"][number]): string {
	return item.sentence.replace(/\{\{(\d+)\}\}/g, (_, idx: string) => {
		const answer = item.blanks?.[Number(idx)]?.answer;
		return answer ? canonical(answer) : "___";
	});
}

export interface MatchFillResult {
	score: number;
	correct: boolean;
}

interface Props {
	exercise: MatchFillExercise;
	onResult: (result: MatchFillResult) => void;
	onNext: () => void;
}

export function MatchFill({ exercise, onResult, onNext }: Props) {
	const [state, dispatch] = useReducer(reducer, {
		status: "idle",
		selectedLeft: null,
		userPairs: {},
		answers: emptyAnswers(),
	});

	const isSubmitted =
		state.status === "correct" ||
		state.status === "incorrect" ||
		state.status === "partial";

	const allMatched = exercise.left.every(
		(_, leftIdx) => state.userPairs[leftIdx] !== undefined,
	);
	const allBlanksAnswered = (["left", "right"] as const).every((side) =>
		exercise[side].every((item, itemIdx) =>
			(item.blanks ?? []).every(
				(_, blankIdx) =>
					(state.answers[side][itemIdx]?.[blankIdx] ?? "").trim().length > 0,
			),
		),
	);

	const blankIsCorrect = (
		side: Side,
		itemIdx: number,
		blankIdx: number,
	): boolean | undefined => {
		if (!isSubmitted) return undefined;
		const blank = exercise[side][itemIdx]?.blanks?.[blankIdx];
		if (!blank) return undefined;
		return answersMatch(
			state.answers[side][itemIdx]?.[blankIdx] ?? "",
			blank.answer,
		);
	};

	const pairIsCorrect = (leftIdx: number): boolean | undefined => {
		if (!isSubmitted) return undefined;
		return state.userPairs[leftIdx] === exercise.matches[leftIdx];
	};

	const handleVerify = () => {
		let total = exercise.left.length;
		let correct = 0;

		exercise.left.forEach((_, leftIdx) => {
			if (state.userPairs[leftIdx] === exercise.matches[leftIdx]) correct++;
		});

		(["left", "right"] as const).forEach((side) => {
			exercise[side].forEach((item, itemIdx) => {
				(item.blanks ?? []).forEach((blank, blankIdx) => {
					total++;
					if (
						answersMatch(
							state.answers[side][itemIdx]?.[blankIdx] ?? "",
							blank.answer,
						)
					) {
						correct++;
					}
				});
			});
		});

		const score = total === 0 ? 0 : correct / total;
		const outcome: "correct" | "incorrect" | "partial" =
			score >= 1 ? "correct" : score === 0 ? "incorrect" : "partial";

		dispatch({ type: "submit", outcome });
		onResult({ score, correct: score >= 1 });
	};

	const renderSentence = (
		item: MatchFillExercise["left"][number],
		side: Side,
		itemIdx: number,
	) => (
		<span>
			{item.label && (
				<span className="mr-1 font-semibold text-[var(--c-accent)]">
					{item.label}
				</span>
			)}
			{parseSentence(item.sentence).map((segment, segmentIdx) => {
				if (segment.type === "text") {
					// biome-ignore lint/suspicious/noArrayIndexKey: stable sentence pieces
					return <span key={segmentIdx}>{segment.text}</span>;
				}

				const blank = item.blanks?.[segment.index];
				const correct = blankIsCorrect(side, itemIdx, segment.index);
				const borderClass =
					correct === undefined
						? "border-[var(--c-border)]"
						: correct
							? "border-[var(--c-correct)]"
							: "border-[var(--c-incorrect)]";

				return (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: stable sentence pieces
						key={segmentIdx}
						className="mx-1 inline-flex flex-col items-center align-middle"
						onClick={(event) => event.stopPropagation()}
						onKeyDown={(event) => event.stopPropagation()}
					>
						<input
							type="text"
							value={state.answers[side][itemIdx]?.[segment.index] ?? ""}
							onChange={(event) =>
								dispatch({
									type: "set-answer",
									side,
									itemIdx,
									blankIdx: segment.index,
									value: event.target.value,
								})
							}
							disabled={isSubmitted}
							className={`inline-block w-28 rounded border px-2 py-0.5 text-center text-[var(--c-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] ${borderClass}`}
							aria-label={`Blanco ${segment.index + 1}`}
						/>
						{!isSubmitted && blank?.hint && (
							<span className="mt-1 text-[11px] font-medium leading-none text-[#6b7280]">
								{blank.hint}
							</span>
						)}
						{isSubmitted && blank && (
							<span className="mt-1 text-[11px] font-semibold leading-none text-[var(--c-correct)]">
								{canonical(blank.answer)}
							</span>
						)}
					</span>
				);
			})}
		</span>
	);

	const pairedLeftForRight = (rightIdx: number): number | undefined => {
		const pair = Object.entries(state.userPairs).find(
			([, pairedRight]) => pairedRight === rightIdx,
		);
		return pair ? Number(pair[0]) : undefined;
	};

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
						disabled={!allMatched || !allBlanksAnswered}
					/>
				</div>
			}
		>
			<ContextHint text={exercise.contextHint} />
			{!isSubmitted && (
				<p className="mb-3 text-xs text-[var(--c-accent)]">
					Completa los verbos y enlaza cada elemento de la columna izquierda
					con uno de la derecha.
				</p>
			)}

			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-3">
					<p className="text-xs font-bold uppercase tracking-wide text-[var(--c-accent)]">
						{exercise.leftTitle ?? "Columna A"}
					</p>
					{exercise.left.map((item, leftIdx) => {
						const isSelected = state.selectedLeft === leftIdx;
						const rightIdx = state.userPairs[leftIdx];
						const correct = pairIsCorrect(leftIdx);
						const cls = [
							"rounded-lg border px-4 py-3 text-left text-sm transition-all",
							isSubmitted && correct === true
								? "border-[var(--c-correct)] bg-[var(--c-correct)]/10"
								: "",
							isSubmitted && correct === false
								? "border-[var(--c-incorrect)] bg-[var(--c-incorrect)]/10"
								: "",
							!isSubmitted && isSelected
								? "border-[var(--c-primary)] bg-[var(--c-primary)]/10 ring-2 ring-[var(--c-primary)]"
								: "",
							!isSubmitted && !isSelected && rightIdx !== undefined
								? "border-[var(--c-primary)]/60 bg-[var(--c-primary)]/5"
								: "",
							!isSubmitted && !isSelected && rightIdx === undefined
								? "border-[var(--c-border)] bg-[var(--c-card)] hover:border-[var(--c-primary)]"
								: "",
						]
							.filter(Boolean)
							.join(" ");

						return (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: stable source order
								key={leftIdx}
								className={cls}
								role="button"
								tabIndex={isSubmitted ? -1 : 0}
								onClick={() =>
									!isSubmitted &&
									dispatch({ type: "select-left", idx: leftIdx })
								}
								onKeyDown={(event) => {
									if (!isSubmitted && (event.key === "Enter" || event.key === " ")) {
										event.preventDefault();
										dispatch({ type: "select-left", idx: leftIdx });
									}
								}}
							>
								{renderSentence(item, "left", leftIdx)}
								{rightIdx !== undefined && !isSubmitted && (
									<p className="mt-2 text-xs text-[var(--c-accent)]">
										Emparejado con {exercise.right[rightIdx]?.label ?? rightIdx + 1}
									</p>
								)}
								{isSubmitted && correct === false && (
									<p className="mt-2 text-xs text-[var(--c-fg)] opacity-80">
										→{" "}
										<span className="font-semibold text-[var(--c-correct)]">
											{exercise.right[exercise.matches[leftIdx]]?.label}{" "}
											{filledSentence(exercise.right[exercise.matches[leftIdx]])}
										</span>
									</p>
								)}
							</div>
						);
					})}
				</div>

				<div className="space-y-3">
					<p className="text-xs font-bold uppercase tracking-wide text-[var(--c-accent)]">
						{exercise.rightTitle ?? "Columna B"}
					</p>
					{exercise.right.map((item, rightIdx) => {
						const leftIdx = pairedLeftForRight(rightIdx);
						const correct =
							isSubmitted && leftIdx !== undefined
								? exercise.matches[leftIdx] === rightIdx
								: undefined;
						const cls = [
							"rounded-lg border px-4 py-3 text-left text-sm transition-all",
							isSubmitted && correct === true
								? "border-[var(--c-correct)] bg-[var(--c-correct)]/10"
								: "",
							isSubmitted && correct === false
								? "border-[var(--c-incorrect)] bg-[var(--c-incorrect)]/10"
								: "",
							isSubmitted && correct === undefined
								? "border-[var(--c-border)] bg-[var(--c-card)] opacity-60"
								: "",
							!isSubmitted && leftIdx !== undefined
								? "border-[var(--c-primary)]/60 bg-[var(--c-primary)]/5"
								: "",
							!isSubmitted && leftIdx === undefined
								? "border-[var(--c-border)] bg-[var(--c-card)] hover:border-[var(--c-primary)]"
								: "",
						]
							.filter(Boolean)
							.join(" ");

						return (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: stable source order
								key={rightIdx}
								className={cls}
								role="button"
								tabIndex={isSubmitted ? -1 : 0}
								onClick={() => {
									if (isSubmitted) return;
									if (state.selectedLeft !== null) {
										dispatch({ type: "select-right", idx: rightIdx });
									} else if (leftIdx !== undefined) {
										dispatch({ type: "unpair-right", idx: rightIdx });
									}
								}}
								onKeyDown={(event) => {
									if (isSubmitted || (event.key !== "Enter" && event.key !== " ")) {
										return;
									}
									event.preventDefault();
									if (state.selectedLeft !== null) {
										dispatch({ type: "select-right", idx: rightIdx });
									} else if (leftIdx !== undefined) {
										dispatch({ type: "unpair-right", idx: rightIdx });
									}
								}}
							>
								{renderSentence(item, "right", rightIdx)}
							</div>
						);
					})}
				</div>
			</div>
		</ExerciseCard>
	);
}
