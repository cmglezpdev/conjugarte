import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { MatchExercise } from "#/content/schema";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

// userPairs[leftIdx] = rightIdx  (or undefined if not paired)
type UserPairs = Record<number, number>;

interface State {
	status: ExerciseStatus;
	// Index of the currently selected left item (null = none selected)
	selectedLeft: number | null;
	// rightIdx → leftIdx mapping as well (for quick lookup of "is this right already taken?")
	userPairs: UserPairs;
}

type Action =
	| { type: "select-left"; idx: number }
	| { type: "select-right"; idx: number }
	| { type: "unpair-left"; idx: number }
	| { type: "unpair-right"; idx: number }
	| { type: "submit"; outcome: "correct" | "incorrect" | "partial" }
	| { type: "reset" };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "select-left": {
			// If already selected, deselect
			if (state.selectedLeft === action.idx) {
				return { ...state, selectedLeft: null };
			}
			return { ...state, status: "answering", selectedLeft: action.idx };
		}
		case "select-right": {
			const leftIdx = state.selectedLeft;
			if (leftIdx === null) return state;

			const rightIdx = action.idx;

			// Remove any existing pair that uses this leftIdx or rightIdx
			const newPairs: UserPairs = {};
			for (const [l, r] of Object.entries(state.userPairs)) {
				const li = Number(l);
				if (li !== leftIdx && r !== rightIdx) {
					newPairs[li] = r;
				}
			}
			newPairs[leftIdx] = rightIdx;

			return {
				...state,
				status: "answering",
				selectedLeft: null,
				userPairs: newPairs,
			};
		}
		case "unpair-left": {
			const newPairs: UserPairs = { ...state.userPairs };
			delete newPairs[action.idx];
			return {
				...state,
				status: "answering",
				userPairs: newPairs,
				selectedLeft: null,
			};
		}
		case "unpair-right": {
			// Find the left that points to this right
			const leftForRight = Object.entries(state.userPairs).find(
				([, r]) => r === action.idx,
			);
			if (!leftForRight) return state;
			const leftIdx = Number(leftForRight[0]);
			const newPairs: UserPairs = { ...state.userPairs };
			delete newPairs[leftIdx];
			return {
				...state,
				status: "answering",
				userPairs: newPairs,
				selectedLeft: null,
			};
		}
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			return { status: "idle", selectedLeft: null, userPairs: {} };
	}
}

// -----------------------------------------------------------------------
// SVG connection overlay — draws lines between paired items
// -----------------------------------------------------------------------

interface ConnectionLine {
	leftIdx: number;
	rightIdx: number;
	/** undefined = not submitted, true = correct, false = incorrect */
	correct?: boolean;
}

interface SvgOverlayProps {
	connections: ConnectionLine[];
	leftRefs: React.RefObject<(HTMLElement | null)[]>;
	rightRefs: React.RefObject<(HTMLElement | null)[]>;
	containerRef: React.RefObject<HTMLDivElement | null>;
}

function SvgOverlay({
	connections,
	leftRefs,
	rightRefs,
	containerRef,
}: SvgOverlayProps) {
	const [lines, setLines] = useState<
		{
			x1: number;
			y1: number;
			x2: number;
			y2: number;
			color: string;
			key: string;
		}[]
	>([]);

	const recalculate = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const containerRect = container.getBoundingClientRect();
		const newLines = connections.map(({ leftIdx, rightIdx, correct }) => {
			const leftEl = leftRefs.current?.[leftIdx];
			const rightEl = rightRefs.current?.[rightIdx];
			if (!leftEl || !rightEl) {
				return null;
			}
			const lr = leftEl.getBoundingClientRect();
			const rr = rightEl.getBoundingClientRect();

			const x1 = lr.right - containerRect.left;
			const y1 = lr.top + lr.height / 2 - containerRect.top;
			const x2 = rr.left - containerRect.left;
			const y2 = rr.top + rr.height / 2 - containerRect.top;

			let color = "var(--c-primary)";
			if (correct === true) color = "var(--c-correct)";
			if (correct === false) color = "var(--c-incorrect)";

			return {
				x1,
				y1,
				x2,
				y2,
				color,
				key: `${leftIdx}-${rightIdx}`,
			};
		});

		setLines(newLines.filter(Boolean) as typeof lines);
	}, [connections, leftRefs, rightRefs, containerRef]);

	// Recalculate on every render cycle + resize
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - recalculate when connections change
	useEffect(() => {
		recalculate();
	}, [recalculate, connections]);

	useEffect(() => {
		const obs = new ResizeObserver(() => recalculate());
		const container = containerRef.current;
		if (container) obs.observe(container);
		return () => obs.disconnect();
	}, [recalculate, containerRef]);

	if (lines.length === 0) return null;

	return (
		<svg
			aria-hidden="true"
			style={{
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
				overflow: "visible",
			}}
		>
			<defs>
				{lines.map((line) => (
					<marker
						key={`arrow-${line.key}`}
						id={`arrow-${line.key}`}
						markerWidth="8"
						markerHeight="8"
						refX="6"
						refY="3"
						orient="auto"
					>
						<path d="M0,0 L0,6 L8,3 z" fill={line.color} />
					</marker>
				))}
			</defs>
			<AnimatePresence>
				{lines.map((line) => (
					<motion.line
						key={line.key}
						x1={line.x1}
						y1={line.y1}
						x2={line.x2}
						y2={line.y2}
						stroke={line.color}
						strokeWidth={2}
						strokeDasharray={line.color === "var(--c-primary)" ? "5,3" : "none"}
						markerEnd={`url(#arrow-${line.key})`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						// biome-ignore lint/suspicious/noExplicitAny: motion SVG element typing
						transition={{ duration: 0.25 } as any}
					/>
				))}
			</AnimatePresence>
		</svg>
	);
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

export interface MatchResult {
	score: number;
	correct: boolean;
}

interface Props {
	exercise: MatchExercise;
	onResult: (result: MatchResult) => void;
	onNext: () => void;
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function Match({ exercise, onResult, onNext }: Props) {
	const pairs = exercise.pairs;

	// Shuffle the right column once (stable via useMemo equivalent — in reducer init)
	const [shuffledRightOrder] = useState<number[]>(() => {
		const indices = pairs.map((_, i) => i);
		// Fisher-Yates
		for (let i = indices.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[indices[i], indices[j]] = [indices[j], indices[i]];
		}
		return indices;
	});

	const [state, dispatch] = useReducer(reducer, {
		status: "idle",
		selectedLeft: null,
		userPairs: {},
	});

	const isSubmitted =
		state.status === "correct" ||
		state.status === "incorrect" ||
		state.status === "partial";

	// Refs for SVG overlay line calculation
	const containerRef = useRef<HTMLDivElement | null>(null);
	const leftRefs = useRef<(HTMLElement | null)[]>([]);
	const rightRefs = useRef<(HTMLElement | null)[]>([]);

	// Build connection list for SVG overlay
	// userPairs: leftIdx → correctRightIdx (original right index)
	// shuffledRightOrder[displayIdx] = originalRightIdx
	// rightRefs are indexed by displayIdx, so we need displayIdx for a given originalRightIdx
	const originalToDisplayRight = new Map(
		shuffledRightOrder.map((origIdx, displayIdx) => [origIdx, displayIdx]),
	);

	const connections: ConnectionLine[] = Object.entries(state.userPairs).map(
		([leftIdxStr, origRightIdx]) => {
			const leftIdx = Number(leftIdxStr);
			const displayRight =
				originalToDisplayRight.get(origRightIdx) ?? origRightIdx;
			let correct: boolean | undefined;
			if (isSubmitted) {
				// Correct if leftIdx's original correct pair is origRightIdx
				correct = pairs[leftIdx].right === pairs[origRightIdx].right;
				// Actually: correct iff the user paired left[leftIdx] with right[leftIdx]
				// (which means origRightIdx === leftIdx)
				correct = origRightIdx === leftIdx;
			}
			return { leftIdx, rightIdx: displayRight, correct };
		},
	);

	const handleVerify = () => {
		let correctCount = 0;
		for (const [leftIdxStr, origRightIdx] of Object.entries(state.userPairs)) {
			const leftIdx = Number(leftIdxStr);
			if (leftIdx === origRightIdx) correctCount++;
		}
		const total = pairs.length;
		const score = total === 0 ? 0 : correctCount / total;
		const outcome: "correct" | "incorrect" | "partial" =
			score >= 1 ? "correct" : score === 0 ? "incorrect" : "partial";

		dispatch({ type: "submit", outcome });
		onResult({ score, correct: score >= 1 });
	};

	const getRightOriginalIdx = (displayIdx: number) =>
		shuffledRightOrder[displayIdx];

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
			{exercise.instructions && (
				<p className="mb-3 text-sm text-[var(--c-accent)]">
					{exercise.instructions}
				</p>
			)}
			{!isSubmitted && (
				<p className="mb-3 text-xs text-[var(--c-accent)]">
					Selecciona un elemento de la izquierda y luego uno de la derecha para
					emparejarlos. Haz clic en un emparejado para deshacerlo.
				</p>
			)}

			{/* Main pairing area — two columns with SVG overlay */}
			<div
				ref={containerRef}
				style={{ position: "relative" }}
				className="flex gap-16 items-start"
			>
				{/* SVG overlay for connection lines */}
				<SvgOverlay
					connections={connections}
					leftRefs={leftRefs}
					rightRefs={rightRefs}
					containerRef={containerRef}
				/>

				{/* Left column */}
				<div className="flex flex-col gap-3 flex-1">
					{pairs.map((pair, leftIdx) => {
						const isPaired = state.userPairs[leftIdx] !== undefined;
						const isSelected = state.selectedLeft === leftIdx;
						const pairedRightOrigIdx = state.userPairs[leftIdx];

						let pairedCorrect: boolean | undefined;
						if (isSubmitted && isPaired) {
							pairedCorrect = pairedRightOrigIdx === leftIdx;
						}

						let cls =
							"w-full rounded-lg border px-4 py-2.5 text-left font-medium transition-all cursor-pointer text-[var(--c-fg)] focus-visible:ring-2 focus-visible:ring-[var(--c-primary)] ";

						if (isSubmitted) {
							if (pairedCorrect === true)
								cls += "border-[var(--c-correct)] bg-[var(--c-correct)]/10";
							else if (pairedCorrect === false)
								cls += "border-[var(--c-incorrect)] bg-[var(--c-incorrect)]/10";
							else
								cls += "border-[var(--c-border)] bg-[var(--c-card)] opacity-60";
						} else if (isSelected) {
							cls +=
								"border-[var(--c-primary)] bg-[var(--c-primary)]/10 ring-2 ring-[var(--c-primary)]";
						} else if (isPaired) {
							cls += "border-[var(--c-primary)]/60 bg-[var(--c-primary)]/5";
						} else {
							cls +=
								"border-[var(--c-border)] bg-[var(--c-card)] hover:border-[var(--c-primary)]";
						}

						return (
							<motion.button
								// biome-ignore lint/suspicious/noArrayIndexKey: stable positional items
								key={leftIdx}
								ref={(el) => {
									leftRefs.current[leftIdx] = el;
								}}
								type="button"
								data-testid={`match-left-${leftIdx}`}
								className={cls}
								disabled={isSubmitted}
								animate={{ scale: isSelected ? 1.02 : 1 }}
								transition={{ duration: 0.15 }}
								onClick={() => {
									if (isPaired && !isSelected) {
										// Toggle: click paired left to unpair
										dispatch({ type: "unpair-left", idx: leftIdx });
									} else {
										dispatch({ type: "select-left", idx: leftIdx });
									}
								}}
							>
								{pair.left}
							</motion.button>
						);
					})}
				</div>

				{/* Right column (shuffled) */}
				<div className="flex flex-col gap-3 flex-1">
					{shuffledRightOrder.map((origRightIdx, displayIdx) => {
						const pairedByLeft = Object.entries(state.userPairs).find(
							([, r]) => r === origRightIdx,
						);
						const isPaired = pairedByLeft !== undefined;
						const leftIdxForThis = isPaired
							? Number(pairedByLeft?.[0])
							: undefined;

						let pairedCorrect: boolean | undefined;
						if (isSubmitted && isPaired && leftIdxForThis !== undefined) {
							pairedCorrect = origRightIdx === leftIdxForThis;
						}

						let cls =
							"w-full rounded-lg border px-4 py-2.5 text-left font-medium transition-all cursor-pointer text-[var(--c-fg)] focus-visible:ring-2 focus-visible:ring-[var(--c-primary)] ";

						if (isSubmitted) {
							if (pairedCorrect === true)
								cls += "border-[var(--c-correct)] bg-[var(--c-correct)]/10";
							else if (pairedCorrect === false)
								cls += "border-[var(--c-incorrect)] bg-[var(--c-incorrect)]/10";
							else
								cls += "border-[var(--c-border)] bg-[var(--c-card)] opacity-60";
						} else if (isPaired) {
							cls += "border-[var(--c-primary)]/60 bg-[var(--c-primary)]/5";
						} else {
							cls +=
								"border-[var(--c-border)] bg-[var(--c-card)] hover:border-[var(--c-primary)]";
						}

						return (
							<motion.button
								key={`right-${origRightIdx}`}
								ref={(el) => {
									rightRefs.current[displayIdx] = el;
								}}
								type="button"
								data-testid={`match-right-${displayIdx}`}
								className={cls}
								disabled={isSubmitted}
								animate={{ scale: 1 }}
								transition={{ duration: 0.15 }}
								onClick={() => {
									if (state.selectedLeft !== null) {
										dispatch({
											type: "select-right",
											idx: getRightOriginalIdx(displayIdx),
										});
									} else if (isPaired) {
										dispatch({ type: "unpair-right", idx: origRightIdx });
									}
								}}
							>
								{pairs[origRightIdx].right}
							</motion.button>
						);
					})}
				</div>
			</div>
		</ExerciseCard>
	);
}
