import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { useMemo, useReducer } from "react";
import type { ReorderExercise } from "#/content/schema";
import { ContextHint } from "./_shared/ContextHint";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

// Each item has its own ordered list of fragment IDs
type ItemOrder = string[];
type Orders = Record<number, ItemOrder>;

interface State {
	status: ExerciseStatus;
	orders: Orders;
}

type Action =
	| { type: "move"; itemIdx: number; newOrder: ItemOrder }
	| { type: "submit"; outcome: "correct" | "incorrect" | "partial" }
	| { type: "reset"; initialOrders: Orders };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "move":
			return {
				...state,
				status: "answering",
				orders: { ...state.orders, [action.itemIdx]: action.newOrder },
			};
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			return { status: "idle", orders: action.initialOrders };
	}
}

// -----------------------------------------------------------------------
// Render the correct order as natural French text (no space after
// apostrophe-ended fragments like "n'" or "j'").
// -----------------------------------------------------------------------

function joinFragments(fragments: string[]): string {
	let result = "";
	for (let i = 0; i < fragments.length; i++) {
		const frag = fragments[i] ?? "";
		if (i > 0) {
			const prev = fragments[i - 1] ?? "";
			if (!/['’]$/.test(prev)) result += " ";
		}
		result += frag;
	}
	return result;
}

// -----------------------------------------------------------------------
// Fisher-Yates shuffle (deterministic per mount)
// -----------------------------------------------------------------------

function shuffleArray<T>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		// biome-ignore lint/style/noNonNullAssertion: bounds guaranteed
		[result[i], result[j]] = [result[j]!, result[i]!];
	}
	return result;
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------

export interface ReorderResult {
	score: number;
	correct: boolean;
}

interface Props {
	exercise: ReorderExercise;
	onResult: (result: ReorderResult) => void;
	onNext: () => void;
}

// -----------------------------------------------------------------------
// SortableFragment — a single draggable chip
// -----------------------------------------------------------------------

interface SortableFragmentProps {
	id: string;
	text: string;
	disabled: boolean;
	isCorrect?: boolean;
	isSubmitted: boolean;
}

function SortableFragment({
	id,
	text,
	disabled,
	isCorrect,
	isSubmitted,
}: SortableFragmentProps) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id, disabled });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	let borderColor = "border-[var(--c-border)]";
	if (isSubmitted) {
		borderColor = isCorrect
			? "border-[var(--c-correct)]"
			: "border-[var(--c-incorrect)]";
	}

	return (
		<button
			type="button"
			ref={setNodeRef}
			style={style}
			data-testid={`reorder-fragment-${id}`}
			aria-label={`Fragmento: ${text}`}
			className={`flex w-full items-center gap-2 rounded-lg border bg-[var(--c-card)] px-4 py-2.5 shadow-sm transition-colors ${borderColor} ${disabled ? "cursor-default opacity-80" : "cursor-grab active:cursor-grabbing"}`}
			{...attributes}
			{...listeners}
		>
			{/* Drag handle */}
			{!disabled && (
				<span
					aria-hidden="true"
					className="select-none text-[var(--c-accent)] opacity-50"
				>
					⠿
				</span>
			)}
			<span className="text-sm font-medium text-[var(--c-fg)]">{text}</span>
		</button>
	);
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function Reorder({ exercise, onResult, onNext }: Props) {
	// Build stable initial shuffled orders (one per item), computed once at mount
	const initialOrders: Orders = useMemo(() => {
		const result: Orders = {};
		for (let i = 0; i < exercise.items.length; i++) {
			// biome-ignore lint/style/noNonNullAssertion: index guaranteed
			const item = exercise.items[i]!;
			// Create unique IDs: itemIdx-fragmentIdx to avoid cross-item collisions
			const ids = item.correctOrder.map((_, fragIdx) => `${i}-${fragIdx}`);
			result[i] = shuffleArray(ids);
		}
		return result;
	}, [exercise.items]);

	const [state, dispatch] = useReducer(reducer, {
		status: "idle",
		orders: initialOrders,
	});

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

	// Build per-item correctness after submit
	const itemCorrectness: Record<number, boolean[]> = {};
	if (isSubmitted) {
		exercise.items.forEach((_item, itemIdx) => {
			const currentOrder =
				state.orders[itemIdx] ?? initialOrders[itemIdx] ?? [];
			itemCorrectness[itemIdx] = currentOrder.map((id, pos) => {
				// ID format: `${itemIdx}-${originalFragIdx}`
				const originalFragIdx = Number(id.split("-")[1]);
				return originalFragIdx === pos;
			});
		});
	}

	const handleDragEnd = (itemIdx: number) => (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const currentOrder = state.orders[itemIdx] ?? initialOrders[itemIdx] ?? [];
		const oldIndex = currentOrder.indexOf(String(active.id));
		const newIndex = currentOrder.indexOf(String(over.id));

		if (oldIndex === -1 || newIndex === -1) return;

		dispatch({
			type: "move",
			itemIdx,
			newOrder: arrayMove(currentOrder, oldIndex, newIndex),
		});
	};

	const handleVerify = () => {
		const total = exercise.items.length;
		let correct = 0;

		exercise.items.forEach((item, itemIdx) => {
			const currentOrder =
				state.orders[itemIdx] ?? initialOrders[itemIdx] ?? [];
			const isItemCorrect = currentOrder.every((id, pos) => {
				const originalFragIdx = Number(id.split("-")[1]);
				return originalFragIdx === pos;
			});
			// An item is correct only if ALL fragments are in the right position
			if (isItemCorrect && currentOrder.length === item.correctOrder.length)
				correct++;
		});

		const score = total === 0 ? 0 : correct / total;
		const outcome: "correct" | "incorrect" | "partial" =
			score >= 1 ? "correct" : score === 0 ? "incorrect" : "partial";

		dispatch({ type: "submit", outcome });
		onResult({ score, correct: score >= 1 });
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
					/>
				</div>
			}
		>
			<ContextHint text={exercise.contextHint} />
			<div className="space-y-6">
				{exercise.items.map((item, itemIdx) => {
					const currentOrder =
						state.orders[itemIdx] ?? initialOrders[itemIdx] ?? [];
					const correctnessMap = itemCorrectness[itemIdx] ?? [];
					const itemFullyCorrect =
						isSubmitted && correctnessMap.every(Boolean);

					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: stable positional items
						<div key={itemIdx} data-testid={`reorder-item-${itemIdx}`}>
							{exercise.items.length > 1 && (
								<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--c-accent)]">
									Oración {itemIdx + 1}
								</p>
							)}
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd(itemIdx)}
							>
								<SortableContext
									items={currentOrder}
									strategy={verticalListSortingStrategy}
								>
									<motion.div layout className="flex flex-col gap-2">
										{currentOrder.map((id, pos) => {
											const fragIdx = Number(id.split("-")[1]);
											const text = item.correctOrder[fragIdx] ?? "";
											const isFragCorrect = isSubmitted
												? (correctnessMap[pos] ?? false)
												: undefined;
											return (
												<SortableFragment
													key={id}
													id={id}
													text={text}
													disabled={isSubmitted}
													isCorrect={isFragCorrect}
													isSubmitted={isSubmitted}
												/>
											);
										})}
									</motion.div>
								</SortableContext>
							</DndContext>
							{isSubmitted && !itemFullyCorrect && (
								<p
									data-testid={`reorder-expected-${itemIdx}`}
									className="mt-2 text-sm text-[var(--c-fg)] opacity-80"
								>
									Orden correcto:{" "}
									<span className="font-semibold text-[var(--c-correct)]">
										{joinFragments(item.correctOrder)}
									</span>
								</p>
							)}
						</div>
					);
				})}
			</div>
		</ExerciseCard>
	);
}
