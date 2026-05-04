import { useProgress } from "#/stores/progress";

interface ProgressBadgeProps {
	ids: string[];
	total: number;
}

/**
 * Pill badge that shows "X/N" completed count for a given set of exercise IDs.
 * Subscribes to only the relevant slice of the Zustand progress store so
 * re-renders stay minimal and the count updates live when exercises complete.
 */
export function ProgressBadge({ ids, total }: ProgressBadgeProps) {
	// Subscribe with a fine-grained selector: only re-render when the completed
	// count for our specific IDs changes.
	const completed = useProgress((state) => {
		let count = 0;
		for (const id of ids) {
			if (state.byExerciseId[id]?.status === "completed") count++;
		}
		return count;
	});

	return (
		<span className="ml-auto shrink-0 rounded-full bg-[var(--c-border)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--c-fg)]">
			{completed}/{total}
		</span>
	);
}
