import type { ExerciseStatus } from "./useExerciseState";

function normalizeHeading(s: string): string {
	return s.trim().replace(/\s+/g, " ").toLowerCase().normalize("NFC");
}

interface ExerciseCardProps {
	title: string;
	instructions?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	status?: ExerciseStatus;
}

const statusStyles: Partial<Record<ExerciseStatus, string>> = {
	correct:
		"border-[var(--color-correct)] shadow-[0_0_0_2px_var(--color-correct)]",
	incorrect:
		"border-[var(--color-incorrect)] shadow-[0_0_0_2px_var(--color-incorrect)]",
	partial:
		"border-[var(--color-partial)] shadow-[0_0_0_2px_var(--color-partial)]",
};

export function ExerciseCard({
	title,
	instructions,
	children,
	footer,
	status,
}: ExerciseCardProps) {
	const borderStyle =
		status && status in statusStyles
			? statusStyles[status]
			: "border-[var(--color-border)]";

	const instructionsDeduped =
		instructions &&
		normalizeHeading(instructions) !== normalizeHeading(title)
			? instructions
			: undefined;

	return (
		<div
			className={`mx-auto w-full max-w-2xl rounded-xl border bg-[var(--color-card)] p-6 shadow-sm transition-all ${borderStyle}`}
		>
			<h2 className="mb-2 text-xl font-semibold text-[var(--color-fg)]">
				{title}
			</h2>
			{instructionsDeduped && (
				<p
					data-testid="exercise-instructions"
					className="mb-4 text-sm text-[var(--c-fg-muted)]"
				>
					{instructionsDeduped}
				</p>
			)}
			<div className="space-y-4">{children}</div>
			{footer && <div className="mt-6">{footer}</div>}
		</div>
	);
}
