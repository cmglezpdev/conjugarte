import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { motion } from "motion/react";
import { useMemo, useReducer, useState } from "react";
import type { FillBlankExercise } from "#/content/schema";
import { hintDuplicatesParenthetical } from "./_shared/blankHint";
import { ContextHint } from "./_shared/ContextHint";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import { answersMatch } from "./_shared/normalize";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

// answers are indexed as: answers[itemIdx][blankIdx] = value (string for verify)
type Answers = Record<number, Record<number, string>>;

// wordBank mode: identity of each chip is its INDEX in exercise.wordBank
// (NOT the string), so duplicate words like "Andare" / "Andare" remain
// distinct entities. Placement maps bankIdx -> [itemIdx, blankIdx] | null.
type WordPlacement = Record<number, [number, number] | null>;

interface State {
	status: ExerciseStatus;
	answers: Answers;
	wordPlacements: WordPlacement;
}

type Action =
	| { type: "set"; itemIdx: number; blankIdx: number; value: string }
	| {
			type: "placeWord";
			bankIdx: number;
			word: string;
			itemIdx: number;
			blankIdx: number;
			previousBankIdx: number | null;
	  }
	| {
			type: "returnWord";
			bankIdx: number;
			itemIdx: number;
			blankIdx: number;
	  }
	| { type: "submit"; outcome: "correct" | "incorrect" | "partial" }
	| { type: "reset" };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "set": {
			const item = state.answers[action.itemIdx] ?? {};
			return {
				...state,
				status: "answering",
				answers: {
					...state.answers,
					[action.itemIdx]: { ...item, [action.blankIdx]: action.value },
				},
			};
		}
		case "placeWord": {
			// Place a chip (by bankIdx) into a blank. If the blank already held
			// another chip, that previous chip is released back to the bank.
			const item = state.answers[action.itemIdx] ?? {};
			const newPlacements = { ...state.wordPlacements };
			newPlacements[action.bankIdx] = [action.itemIdx, action.blankIdx];
			if (
				action.previousBankIdx !== null &&
				action.previousBankIdx !== action.bankIdx
			) {
				newPlacements[action.previousBankIdx] = null;
			}
			return {
				...state,
				status: "answering",
				wordPlacements: newPlacements,
				answers: {
					...state.answers,
					[action.itemIdx]: {
						...item,
						[action.blankIdx]: action.word,
					},
				},
			};
		}
		case "returnWord": {
			const newPlacements = { ...state.wordPlacements };
			newPlacements[action.bankIdx] = null;
			const item = state.answers[action.itemIdx] ?? {};
			return {
				...state,
				status: "answering",
				wordPlacements: newPlacements,
				answers: {
					...state.answers,
					[action.itemIdx]: { ...item, [action.blankIdx]: "" },
				},
			};
		}
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			return { status: "idle", answers: {}, wordPlacements: {} };
	}
}

// Reverse lookup: which bankIdx is currently sitting in this blank?
function findBankIdxInBlank(
	placements: WordPlacement,
	itemIdx: number,
	blankIdx: number,
): number | null {
	for (const [key, loc] of Object.entries(placements)) {
		if (loc && loc[0] === itemIdx && loc[1] === blankIdx) {
			return Number(key);
		}
	}
	return null;
}

// -----------------------------------------------------------------------
// Sentence parser — splits "Je {{0}} mangé." into segments
// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

export interface FillBlankResult {
	score: number;
	correct: boolean;
}

interface Props {
	exercise: FillBlankExercise;
	onResult: (result: FillBlankResult) => void;
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
// HintLabel — small neutral chip shown directly under a blank/input.
// Uses a fixed grey (NOT --c-accent which is red in FR/IT themes and
// would falsely signal "error") and is taken out of pointer flow.
// -----------------------------------------------------------------------

function HintLabel({ children }: { children: React.ReactNode }) {
	// In-flow (NOT absolute): contributes to the parent flex-col's height so
	// the line-box only grows where there's actually a hinted input. Other
	// lines keep their natural leading.
	return (
		<span className="pointer-events-none mt-1 whitespace-nowrap text-[11px] font-medium leading-none text-[#6b7280]">
			{children}
		</span>
	);
}

function pickCanonicalAnswer(answer: string | string[]): string {
	return Array.isArray(answer) ? (answer[0] ?? "") : answer;
}

function ExpectedAnswerLabel({
	answer,
	isCorrect,
}: {
	answer: string | string[];
	isCorrect: boolean;
}) {
	const canonical = pickCanonicalAnswer(answer);
	const color = isCorrect ? "text-[var(--c-correct)]" : "text-[var(--c-incorrect)]";
	return (
		<span
			data-testid="expected-answer-label"
			className={`pointer-events-none mt-1 whitespace-nowrap text-[11px] font-semibold leading-none ${color}`}
		>
			{canonical}
		</span>
	);
}

// -----------------------------------------------------------------------
// WordBank mode — chip components
// WordChipVisual is a pure presentational pill (used in the DragOverlay so
// we don't double-register a useDraggable id). DraggableWordChip wraps it
// with dnd-kit hooks for the actual chips in the bank.
// -----------------------------------------------------------------------

interface WordChipVisualProps {
	word: string;
	disabled?: boolean;
	isDragging?: boolean;
	isOverlay?: boolean;
}

function chipClassName({
	disabled,
	isDragging,
	isOverlay,
}: Pick<WordChipVisualProps, "disabled" | "isDragging" | "isOverlay">): string {
	return [
		"inline-flex cursor-grab items-center rounded-full border border-[var(--c-border)] bg-[var(--c-card)] px-3 py-1 text-sm font-medium text-[var(--c-fg)] shadow-sm select-none active:cursor-grabbing",
		isDragging ? "opacity-30" : "",
		isOverlay ? "shadow-md opacity-90" : "",
		disabled ? "cursor-default opacity-50" : "",
	]
		.filter(Boolean)
		.join(" ");
}

function WordChipVisual({
	word,
	disabled,
	isDragging,
	isOverlay,
}: WordChipVisualProps) {
	return (
		<span
			data-testid={`word-chip-${word}`}
			className={chipClassName({ disabled, isDragging, isOverlay })}
		>
			{word}
		</span>
	);
}

interface DraggableWordChipProps {
	bankIdx: number;
	word: string;
	disabled: boolean;
}

function DraggableWordChip({
	bankIdx,
	word,
	disabled,
}: DraggableWordChipProps) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `bank-word-${bankIdx}`,
		disabled,
	});

	return (
		<button
			type="button"
			ref={setNodeRef}
			data-testid={`word-chip-${word}`}
			aria-label={`Palabra del banco: ${word}`}
			className={chipClassName({ disabled, isDragging })}
			{...(disabled ? {} : attributes)}
			{...(disabled ? {} : listeners)}
		>
			{word}
		</button>
	);
}

// -----------------------------------------------------------------------
// WordBank mode — DroppableBlank
// -----------------------------------------------------------------------

interface DroppableBlankProps {
	itemIdx: number;
	blankIdx: number;
	placedWord: string | null;
	isSubmitted: boolean;
	isCorrect: boolean | undefined;
	/** Called when the user taps the placed word — the parent figures out
	 *  which bankIdx is sitting in this blank and releases it. */
	onReturn: () => void;
}

function DroppableBlank({
	itemIdx,
	blankIdx,
	placedWord,
	isSubmitted,
	isCorrect,
	onReturn,
}: DroppableBlankProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: `blank-${itemIdx}-${blankIdx}`,
		disabled: isSubmitted,
	});

	let borderClass = isOver
		? "border-[var(--c-primary)] bg-[var(--c-primary)]/5"
		: "border-[var(--c-border)] bg-[var(--c-card)]";
	if (isSubmitted && isCorrect !== undefined) {
		borderClass = isCorrect
			? "border-[var(--c-correct)] bg-[var(--c-correct)]/5"
			: "border-[var(--c-incorrect)] bg-[var(--c-incorrect)]/5";
	}

	return (
		<span
			ref={setNodeRef}
			data-testid={`fill-blank-drop-${itemIdx}-${blankIdx}`}
			className={`relative mx-1 inline-flex min-w-20 items-center justify-center rounded border-2 px-2 py-0.5 transition-colors ${borderClass}`}
			style={{ minHeight: "28px" }}
		>
			{placedWord ? (
				<button
					type="button"
					data-testid={`fill-blank-placed-${itemIdx}-${blankIdx}`}
					onClick={() => !isSubmitted && onReturn()}
					disabled={isSubmitted}
					className="text-sm font-medium text-[var(--c-fg)] disabled:cursor-default"
					aria-label={`Palabra colocada: ${placedWord}. Pulsa para devolver al banco.`}
				>
					{placedWord}
				</button>
			) : (
				<span className="text-xs text-[var(--c-accent)] opacity-60">___</span>
			)}
		</span>
	);
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function FillBlank({ exercise, onResult, onNext }: Props) {
	const hasWordBank = Boolean(exercise.wordBank?.length);

	const [state, dispatch] = useReducer(reducer, {
		status: "idle",
		answers: {},
		wordPlacements: {},
	});

	const [activeDragBankIdx, setActiveDragBankIdx] = useState<number | null>(
		null,
	);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const isSubmitted =
		state.status === "correct" ||
		state.status === "incorrect" ||
		state.status === "partial";

	// Track per-blank correctness for visual feedback after submission
	const blankValidity: Record<number, Record<number, boolean>> = {};
	if (isSubmitted) {
		exercise.items.forEach((item, itemIdx) => {
			blankValidity[itemIdx] = {};
			item.blanks.forEach((blank, blankIdx) => {
				const userVal = state.answers[itemIdx]?.[blankIdx] ?? "";
				blankValidity[itemIdx][blankIdx] = answersMatch(userVal, blank.answer);
			});
		});
	}

	const handleVerify = () => {
		let totalBlanks = 0;
		let correctBlanks = 0;

		for (const [itemIdx, item] of exercise.items.entries()) {
			for (const [blankIdx, blank] of item.blanks.entries()) {
				totalBlanks++;
				const userVal = state.answers[itemIdx]?.[blankIdx] ?? "";
				if (answersMatch(userVal, blank.answer)) correctBlanks++;
			}
		}

		const score = totalBlanks === 0 ? 0 : correctBlanks / totalBlanks;
		const outcome: "correct" | "incorrect" | "partial" =
			score >= 1 ? "correct" : score === 0 ? "incorrect" : "partial";

		dispatch({ type: "submit", outcome });
		onResult({ score, correct: score >= 1 });
	};

	// Block verification until every blank in every item has a non-empty value.
	const allAnswered = exercise.items.every((item, itemIdx) =>
		item.blanks.every(
			(_, blankIdx) =>
				(state.answers[itemIdx]?.[blankIdx] ?? "").trim().length > 0,
		),
	);

	// WordBank drag handlers — IDs are now `bank-word-${bankIdx}` so duplicate
	// words remain distinct entities in dnd-kit.
	const parseBankIdx = (id: string): number | null => {
		if (!id.startsWith("bank-word-")) return null;
		const n = Number(id.slice("bank-word-".length));
		return Number.isFinite(n) ? n : null;
	};

	const handleDragStart = (event: DragStartEvent) => {
		const bankIdx = parseBankIdx(String(event.active.id));
		if (bankIdx !== null) setActiveDragBankIdx(bankIdx);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveDragBankIdx(null);
		const { active, over } = event;
		if (!over) return;

		const bankIdx = parseBankIdx(String(active.id));
		if (bankIdx === null) return;
		const word = exercise.wordBank?.[bankIdx];
		if (!word) return;

		const overId = String(over.id);
		if (!overId.startsWith("blank-")) return;
		const parts = overId.split("-");
		// blank-{itemIdx}-{blankIdx}
		const itemIdx = Number(parts[1]);
		const blankIdx = Number(parts[2]);

		// Whatever chip is already in this blank gets bumped back to the bank.
		const previousBankIdx = findBankIdxInBlank(
			state.wordPlacements,
			itemIdx,
			blankIdx,
		);

		dispatch({
			type: "placeWord",
			bankIdx,
			word,
			itemIdx,
			blankIdx,
			previousBankIdx:
				previousBankIdx !== null && previousBankIdx !== bankIdx
					? previousBankIdx
					: null,
		});
	};

	const handleReturnFromBlank = (itemIdx: number, blankIdx: number) => {
		const bankIdx = findBankIdxInBlank(state.wordPlacements, itemIdx, blankIdx);
		if (bankIdx === null) return;
		dispatch({ type: "returnWord", bankIdx, itemIdx, blankIdx });
	};

	// Motion key for animation — changes on status to trigger animation
	const animateKey = isSubmitted ? state.status : "idle";

	// In wordBank mode, derive which CHIPS (by bankIdx) are still in the bank.
	const wordsInBank = useMemo<{ bankIdx: number; word: string }[]>(() => {
		if (!exercise.wordBank) return [];
		return exercise.wordBank
			.map((word, bankIdx) => ({ bankIdx, word }))
			.filter(({ bankIdx }) => state.wordPlacements[bankIdx] == null);
	}, [exercise.wordBank, state.wordPlacements]);

	const activeDragWord =
		activeDragBankIdx !== null
			? (exercise.wordBank?.[activeDragBankIdx] ?? null)
			: null;

	const content = (
		<>
			{/* Word bank — drag-and-drop mode */}
			{hasWordBank && (
				<div
					className="mb-4 rounded-lg border border-[var(--c-border)] bg-[var(--c-bg)] p-3"
					data-testid="word-bank"
				>
					<p className="mb-2 text-sm font-medium text-[var(--c-fg)]">
						Banco de palabras
					</p>
					<div className="flex min-h-8 flex-wrap gap-2">
						{wordsInBank.map(({ bankIdx, word }) => (
							<DraggableWordChip
								key={bankIdx}
								bankIdx={bankIdx}
								word={word}
								disabled={isSubmitted}
							/>
						))}
					</div>
				</div>
			)}

			{/* Context hint — narrative restoration card */}
			<ContextHint text={exercise.contextHint} />

			{/* Exercise items */}
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
						// biome-ignore lint/suspicious/noArrayIndexKey: stable positional items
						<div key={itemIdx} className="leading-loose">
							{segments.map((seg, segIdx) => {
								if (seg.type === "text") {
									// biome-ignore lint/suspicious/noArrayIndexKey: stable
									return <span key={segIdx}>{seg.text}</span>;
								}

								const blankIdx = seg.index;
								const isCorrect = blankValidity[itemIdx]?.[blankIdx];
								const hint = item.blanks[blankIdx]?.hint;
								const showHintBelow =
									hint &&
									!hintDuplicatesParenthetical(item.sentence, hint);

								if (hasWordBank) {
									// Drag-and-drop blank
									const placedWord = state.answers[itemIdx]?.[blankIdx] ?? null;
									return (
										<span
											// biome-ignore lint/suspicious/noArrayIndexKey: stable
											key={segIdx}
											className="relative inline-flex flex-col items-center align-middle"
										>
											<DroppableBlank
												itemIdx={itemIdx}
												blankIdx={blankIdx}
												placedWord={placedWord || null}
												isSubmitted={isSubmitted}
												isCorrect={isSubmitted ? isCorrect : undefined}
												onReturn={() =>
													handleReturnFromBlank(itemIdx, blankIdx)
												}
											/>
											{isSubmitted ? (
												<ExpectedAnswerLabel
													answer={item.blanks[blankIdx].answer}
													isCorrect={!!isCorrect}
												/>
											) : (
												showHintBelow && <HintLabel>{hint}</HintLabel>
											)}
										</span>
									);
								}

								// Text input mode (no wordBank)
								let inputBorderClass = "border-[var(--color-border)]";
								if (isSubmitted) {
									inputBorderClass = isCorrect
										? "border-[var(--color-correct)]"
										: "border-[var(--color-incorrect)]";
								}

								return (
									<span
										// biome-ignore lint/suspicious/noArrayIndexKey: stable
										key={segIdx}
										className="relative inline-flex flex-col items-center align-middle"
									>
										<motion.input
											data-testid={`fill-blank-input-${itemIdx}-${blankIdx}`}
											type="text"
											value={state.answers[itemIdx]?.[blankIdx] ?? ""}
											onChange={(e) =>
												dispatch({
													type: "set",
													itemIdx,
													blankIdx,
													value: e.target.value,
												})
											}
											disabled={isSubmitted}
											className={`mx-1 inline-block w-24 rounded border px-2 py-0.5 text-center text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus-visible:ring-2 focus-visible:ring-[var(--c-primary)] ${inputBorderClass}`}
											aria-label={`Blanco ${blankIdx + 1} del ítem ${itemIdx + 1}`}
											whileFocus={{ scale: 1.06 }}
											transition={{ duration: 0.15 }}
										/>
										{isSubmitted ? (
											<ExpectedAnswerLabel
												answer={item.blanks[blankIdx].answer}
												isCorrect={!!isCorrect}
											/>
										) : (
											showHintBelow && <HintLabel>{hint}</HintLabel>
										)}
									</span>
								);
							})}
						</div>
					);
				})}
			</motion.div>
		</>
	);

	const footer = (
		<div className="space-y-2">
			<FeedbackOverlay status={state.status} />
			<VerifyButton
				status={state.status}
				onVerify={handleVerify}
				onNext={onNext}
				disabled={!allAnswered}
			/>
		</div>
	);

	if (hasWordBank) {
		return (
			<ExerciseCard
				title={exercise.title}
				instructions={exercise.instructions}
				status={state.status}
				footer={footer}
			>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					{content}
					<DragOverlay>
						{activeDragWord && (
							<WordChipVisual word={activeDragWord} isOverlay />
						)}
					</DragOverlay>
				</DndContext>
			</ExerciseCard>
		);
	}

	return (
		<ExerciseCard
			title={exercise.title}
			instructions={exercise.instructions}
			status={state.status}
			footer={footer}
		>
			{content}
		</ExerciseCard>
	);
}
