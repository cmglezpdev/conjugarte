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
import type { CategorizeExercise } from "#/content/schema";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

// placement: null = in neutral bank, string = category name
type Placement = Record<number, string | null>;

interface State {
	status: ExerciseStatus;
	placement: Placement;
}

type Action =
	| { type: "place"; itemIdx: number; category: string | null }
	| { type: "submit"; outcome: "correct" | "incorrect" | "partial" }
	| { type: "reset" };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "place":
			return {
				...state,
				status: "answering",
				placement: { ...state.placement, [action.itemIdx]: action.category },
			};
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			return { status: "idle", placement: {} };
	}
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

export interface CategorizeResult {
	score: number;
	correct: boolean;
}

interface Props {
	exercise: CategorizeExercise;
	onResult: (result: CategorizeResult) => void;
	onNext: () => void;
}

// -----------------------------------------------------------------------
// DraggableChip — drag overlay ghost chip
// -----------------------------------------------------------------------

interface DraggableChipProps {
	id: string;
	word: string;
	disabled: boolean;
	isOverlay?: boolean;
}

function DraggableChip({ word, isOverlay = false }: DraggableChipProps) {
	return (
		<div
			className={`inline-flex cursor-grab items-center rounded-full border border-[var(--c-border)] bg-[var(--c-card)] px-3 py-1.5 text-sm font-medium text-[var(--c-fg)] shadow-sm select-none active:cursor-grabbing ${isOverlay ? "opacity-90 shadow-md" : ""}`}
			aria-hidden={isOverlay}
		>
			{word}
		</div>
	);
}

// -----------------------------------------------------------------------
// WordChip — a draggable word chip placed in a zone or the bank
// -----------------------------------------------------------------------

interface WordChipProps {
	itemIdx: number;
	word: string;
	disabled: boolean;
	isCorrect?: boolean;
	isSubmitted: boolean;
}

function WordChip({
	itemIdx,
	word,
	disabled,
	isCorrect,
	isSubmitted,
}: WordChipProps) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `item-${itemIdx}`,
		disabled,
	});

	let borderColor = "border-[var(--c-border)]";
	if (isSubmitted && isCorrect !== undefined) {
		borderColor = isCorrect
			? "border-[var(--c-correct)]"
			: "border-[var(--c-incorrect)]";
	}

	return (
		<motion.div
			ref={setNodeRef}
			layout
			data-testid={`categorize-chip-${itemIdx}`}
			aria-label={`Palabra: ${word}`}
			className={`inline-flex cursor-grab items-center rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--c-fg)] shadow-sm select-none active:cursor-grabbing ${borderColor} ${isDragging ? "opacity-40" : "bg-[var(--c-card)]"} ${disabled ? "cursor-default" : ""}`}
			{...(disabled ? {} : attributes)}
			{...(disabled ? {} : listeners)}
		>
			{word}
		</motion.div>
	);
}

// -----------------------------------------------------------------------
// DroppableZone — a category drop target
// -----------------------------------------------------------------------

interface DroppableZoneProps {
	category: string;
	itemIdxs: number[];
	items: CategorizeExercise["items"];
	placement: Placement;
	isSubmitted: boolean;
	correctness: Record<number, boolean>;
	disabled: boolean;
}

function DroppableZone({
	category,
	itemIdxs,
	items,
	isSubmitted,
	correctness,
	disabled,
}: DroppableZoneProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: `zone-${category}`,
		disabled,
	});

	// Zone is correct if all items placed in it are correct AND zone has at least one item
	const zoneItems = itemIdxs;
	const allCorrect =
		zoneItems.length > 0 && zoneItems.every((idx) => correctness[idx]);
	const anyIncorrect = zoneItems.some((idx) => correctness[idx] === false);

	let zoneBorder = isOver
		? "border-[var(--c-primary)] bg-[var(--c-primary)]/5"
		: "border-[var(--c-border)] bg-[var(--c-bg)]";
	if (isSubmitted) {
		if (allCorrect)
			zoneBorder = "border-[var(--c-correct)] bg-[var(--c-correct)]/5";
		else if (anyIncorrect)
			zoneBorder = "border-[var(--c-incorrect)] bg-[var(--c-incorrect)]/5";
	}

	return (
		<div
			ref={setNodeRef}
			data-testid={`categorize-zone-${category}`}
			className={`min-h-20 flex-1 rounded-xl border-2 p-3 transition-colors ${zoneBorder}`}
		>
			<p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--c-accent)]">
				{category}
			</p>
			<motion.div layout className="flex flex-wrap gap-2">
				{itemIdxs.map((itemIdx) => {
					const item = items[itemIdx];
					if (!item) return null;
					return (
						<WordChip
							key={`item-${itemIdx}`}
							itemIdx={itemIdx}
							word={item.word}
							disabled={disabled}
							isCorrect={isSubmitted ? correctness[itemIdx] : undefined}
							isSubmitted={isSubmitted}
						/>
					);
				})}
			</motion.div>
		</div>
	);
}

// -----------------------------------------------------------------------
// NeutralBank — holds unplaced items
// -----------------------------------------------------------------------

interface NeutralBankProps {
	itemIdxs: number[];
	items: CategorizeExercise["items"];
	isSubmitted: boolean;
	disabled: boolean;
}

function NeutralBank({
	itemIdxs,
	items,
	isSubmitted,
	disabled,
}: NeutralBankProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: "zone-bank",
		disabled,
	});

	return (
		<div
			ref={setNodeRef}
			data-testid="categorize-bank"
			className={`min-h-14 rounded-lg border p-3 transition-colors ${
				isOver
					? "border-[var(--c-primary)] bg-[var(--c-primary)]/5"
					: "border-dashed border-[var(--c-border)] bg-[var(--c-bg)]"
			}`}
		>
			<p className="mb-2 text-xs font-medium text-[var(--c-accent)]">
				Palabras disponibles
			</p>
			<motion.div layout className="flex flex-wrap gap-2">
				{itemIdxs.map((itemIdx) => {
					const item = items[itemIdx];
					if (!item) return null;
					return (
						<WordChip
							key={`item-${itemIdx}`}
							itemIdx={itemIdx}
							word={item.word}
							disabled={disabled}
							isSubmitted={isSubmitted}
						/>
					);
				})}
			</motion.div>
		</div>
	);
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function Categorize({ exercise, onResult, onNext }: Props) {
	const [state, dispatch] = useReducer(reducer, {
		status: "idle",
		placement: {},
	});

	const [activeItemIdx, setActiveItemIdx] = useState<number | null>(null);

	const isSubmitted =
		state.status === "correct" ||
		state.status === "incorrect" ||
		state.status === "partial";

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// Per-item correctness after submit
	const correctness: Record<number, boolean> = {};
	if (isSubmitted) {
		exercise.items.forEach((item, itemIdx) => {
			const placed = state.placement[itemIdx] ?? null;
			correctness[itemIdx] = placed === item.category;
		});
	}

	// Derive which items are in each zone
	const bankItems = exercise.items
		.map((_, idx) => idx)
		.filter((idx) => (state.placement[idx] ?? null) === null);

	const categoryItems: Record<string, number[]> = {};
	for (const cat of exercise.categories) {
		categoryItems[cat] = exercise.items
			.map((_, idx) => idx)
			.filter((idx) => state.placement[idx] === cat);
	}

	const handleDragStart = (event: DragStartEvent) => {
		const idStr = String(event.active.id);
		if (idStr.startsWith("item-")) {
			setActiveItemIdx(Number(idStr.replace("item-", "")));
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveItemIdx(null);
		const { active, over } = event;
		if (!over) return;

		const activeId = String(active.id);
		const overId = String(over.id);

		if (!activeId.startsWith("item-")) return;
		const itemIdx = Number(activeId.replace("item-", ""));

		let targetCategory: string | null = null;
		if (overId === "zone-bank") {
			targetCategory = null;
		} else if (overId.startsWith("zone-")) {
			targetCategory = overId.replace("zone-", "");
		} else {
			return;
		}

		dispatch({ type: "place", itemIdx, category: targetCategory });
	};

	const handleVerify = () => {
		const total = exercise.items.length;
		let correct = 0;
		exercise.items.forEach((item, itemIdx) => {
			const placed = state.placement[itemIdx] ?? null;
			if (placed === item.category) correct++;
		});

		const score = total === 0 ? 0 : correct / total;
		const outcome: "correct" | "incorrect" | "partial" =
			score >= 1 ? "correct" : score === 0 ? "incorrect" : "partial";

		dispatch({ type: "submit", outcome });
		onResult({ score, correct: score >= 1 });
	};

	const activeItem =
		activeItemIdx !== null ? exercise.items[activeItemIdx] : null;

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
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				{/* Neutral bank */}
				<NeutralBank
					itemIdxs={bankItems}
					items={exercise.items}
					isSubmitted={isSubmitted}
					disabled={isSubmitted}
				/>

				{/* Category drop zones */}
				<div className="mt-4 flex flex-wrap gap-3">
					{exercise.categories.map((cat) => (
						<DroppableZone
							key={cat}
							category={cat}
							itemIdxs={categoryItems[cat] ?? []}
							items={exercise.items}
							placement={state.placement}
							isSubmitted={isSubmitted}
							correctness={correctness}
							disabled={isSubmitted}
						/>
					))}
				</div>

				{/* Drag overlay */}
				<DragOverlay>
					{activeItem && (
						<DraggableChip
							id={`item-${activeItemIdx}`}
							word={activeItem.word}
							disabled={false}
							isOverlay
						/>
					)}
				</DragOverlay>
			</DndContext>
		</ExerciseCard>
	);
}
