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
import { useReducer, useState } from "react";
import type { FillBlankExercise } from "#/content/schema";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import { answersMatch } from "./_shared/normalize";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

// answers are indexed as: answers[itemIdx][blankIdx] = value
type Answers = Record<number, Record<number, string>>;

// wordBank mode: tracking which word is in which blank
// bankSlot: null = word is in bank, [itemIdx, blankIdx] = placed in blank
type WordPlacement = Record<string, [number, number] | null>;

interface State {
	status: ExerciseStatus;
	answers: Answers;
	// wordBank mode: word → placement
	wordPlacements: WordPlacement;
}

type Action =
	| { type: "set"; itemIdx: number; blankIdx: number; value: string }
	| {
			type: "placeWord";
			word: string;
			itemIdx: number;
			blankIdx: number;
			previousWord: string | null;
	  }
	| { type: "returnWord"; word: string; itemIdx: number; blankIdx: number }
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
			// Place word into blank; if blank already had a word, return it to bank
			const item = state.answers[action.itemIdx] ?? {};
			const newPlacements = { ...state.wordPlacements };
			// Mark the new word as placed
			newPlacements[action.word] = [action.itemIdx, action.blankIdx];
			// If another word was already in this blank, return it to bank
			if (action.previousWord && action.previousWord !== action.word) {
				newPlacements[action.previousWord] = null;
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
			newPlacements[action.word] = null;
			const item = state.answers[action.itemIdx] ?? {};
			const currentVal = item[action.blankIdx];
			// Only clear the blank if this word is still there
			const newItem = { ...item };
			if (currentVal === action.word) {
				newItem[action.blankIdx] = "";
			}
			return {
				...state,
				status: "answering",
				wordPlacements: newPlacements,
				answers: {
					...state.answers,
					[action.itemIdx]: newItem,
				},
			};
		}
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			return { status: "idle", answers: {}, wordPlacements: {} };
	}
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
// WordBank mode — DraggableWordChip
// -----------------------------------------------------------------------

interface DraggableWordChipProps {
	word: string;
	disabled: boolean;
	isOverlay?: boolean;
}

function DraggableWordChip({
	word,
	disabled,
	isOverlay = false,
}: DraggableWordChipProps) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `bank-word-${word}`,
		disabled,
	});

	return (
		<button
			type="button"
			ref={setNodeRef}
			data-testid={`word-chip-${word}`}
			aria-label={`Palabra del banco: ${word}`}
			className={`inline-flex cursor-grab items-center rounded-full border border-[var(--c-border)] bg-[var(--c-card)] px-3 py-1 text-sm font-medium text-[var(--c-fg)] shadow-sm select-none active:cursor-grabbing ${isDragging ? "opacity-30" : ""} ${isOverlay ? "shadow-md opacity-90" : ""} ${disabled ? "cursor-default opacity-50" : ""}`}
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
	onReturn: (word: string) => void;
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
					onClick={() => !isSubmitted && onReturn(placedWord)}
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

	const [activeDragWord, setActiveDragWord] = useState<string | null>(null);

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

	// WordBank drag handlers
	const handleDragStart = (event: DragStartEvent) => {
		const id = String(event.active.id);
		if (id.startsWith("bank-word-")) {
			setActiveDragWord(id.replace("bank-word-", ""));
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveDragWord(null);
		const { active, over } = event;
		if (!over) return;

		const activeId = String(active.id);
		const overId = String(over.id);

		if (!activeId.startsWith("bank-word-")) return;
		const word = activeId.replace("bank-word-", "");

		if (!overId.startsWith("blank-")) return;
		const parts = overId.split("-");
		// blank-{itemIdx}-{blankIdx}
		const itemIdx = Number(parts[1]);
		const blankIdx = Number(parts[2]);

		// Find if there's already a word in that blank
		const existingWord = state.answers[itemIdx]?.[blankIdx] ?? null;
		const previousWord =
			existingWord && existingWord !== word ? existingWord : null;

		dispatch({
			type: "placeWord",
			word,
			itemIdx,
			blankIdx,
			previousWord: previousWord || null,
		});
	};

	const handleReturnWord = (
		word: string,
		itemIdx: number,
		blankIdx: number,
	) => {
		dispatch({ type: "returnWord", word, itemIdx, blankIdx });
	};

	// Motion key for animation — changes on status to trigger animation
	const animateKey = isSubmitted ? state.status : "idle";

	// In wordBank mode, derive which words are still in the bank
	const wordsInBank =
		exercise.wordBank?.filter((word) => {
			// A word is in the bank if it's not placed anywhere
			// Check all blanks
			for (const [_itemIdx, blankMap] of Object.entries(state.answers)) {
				for (const [, val] of Object.entries(blankMap)) {
					if (val === word) return false;
				}
			}
			return true;
		}) ?? [];

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
						{wordsInBank.map((word) => (
							<DraggableWordChip
								key={word}
								word={word}
								disabled={isSubmitted}
							/>
						))}
					</div>
				</div>
			)}

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
						<div key={itemIdx} className="leading-relaxed">
							{segments.map((seg, segIdx) => {
								if (seg.type === "text") {
									// biome-ignore lint/suspicious/noArrayIndexKey: stable
									return <span key={segIdx}>{seg.text}</span>;
								}

								const blankIdx = seg.index;
								const isCorrect = blankValidity[itemIdx]?.[blankIdx];
								const hint = item.blanks[blankIdx]?.hint;

								if (hasWordBank) {
									// Drag-and-drop blank
									const placedWord = state.answers[itemIdx]?.[blankIdx] ?? null;
									return (
										<span
											// biome-ignore lint/suspicious/noArrayIndexKey: stable
											key={segIdx}
											className="relative inline-flex flex-col items-center"
										>
											<DroppableBlank
												itemIdx={itemIdx}
												blankIdx={blankIdx}
												placedWord={placedWord || null}
												isSubmitted={isSubmitted}
												isCorrect={isSubmitted ? isCorrect : undefined}
												onReturn={(word) =>
													handleReturnWord(word, itemIdx, blankIdx)
												}
											/>
											{hint && (
												<span className="absolute -bottom-5 text-xs text-[var(--c-accent)]">
													{hint}
												</span>
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
										className="relative inline-flex flex-col items-center"
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
										{hint && (
											<span className="absolute -bottom-5 text-xs text-[var(--color-accent)]">
												{hint}
											</span>
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
			/>
		</div>
	);

	if (hasWordBank) {
		return (
			<ExerciseCard
				title={exercise.title}
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
							<DraggableWordChip
								word={activeDragWord}
								disabled={false}
								isOverlay
							/>
						)}
					</DragOverlay>
				</DndContext>
			</ExerciseCard>
		);
	}

	return (
		<ExerciseCard title={exercise.title} status={state.status} footer={footer}>
			{content}
		</ExerciseCard>
	);
}
