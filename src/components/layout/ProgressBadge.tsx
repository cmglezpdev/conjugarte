import { useProgress } from "#/stores/progress";

interface ProgressBadgeProps {
	ids: string[];
	total: number;
}

/**
 * Pill badge showing "X/N" completed exercises with a native tooltip.
 * - Subscribes to a fine-grained slice of the progress store so re-renders
 *   stay minimal and the count updates live when exercises complete.
 * - When all exercises are completed, the badge turns green to signal the
 *   level is fully done.
 */
export function ProgressBadge({ ids, total }: ProgressBadgeProps) {
	const completed = useProgress((state) => {
		let count = 0;
		for (const id of ids) {
			if (state.byExerciseId[id]?.status === "completed") count++;
		}
		return count;
	});

	const isComplete = total > 0 && completed === total;
	const tooltip = `${completed} de ${total} ejercicios completados`;

	return (
		<span
			title={tooltip}
			className={[
				"ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors",
				isComplete
					? "bg-[var(--c-correct)] text-white"
					: "bg-[var(--c-border)] text-[var(--c-fg)]",
			].join(" ")}
		>
			{isComplete && (
				<svg
					aria-hidden="true"
					width="10"
					height="10"
					viewBox="0 0 10 10"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<polyline points="2 5 4 7 8 3" />
				</svg>
			)}
			{completed}/{total}
		</span>
	);
}
