import type { ExerciseStatus } from "./useExerciseState";

interface ExerciseCardProps {
	title: string;
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
	children,
	footer,
	status,
}: ExerciseCardProps) {
	const borderStyle =
		status && status in statusStyles
			? statusStyles[status]
			: "border-[var(--color-border)]";

	return (
		<div
			className={`mx-auto w-full max-w-2xl rounded-xl border bg-[var(--color-card)] p-6 shadow-sm transition-all ${borderStyle}`}
		>
			<h2 className="mb-4 text-xl font-semibold text-[var(--color-fg)]">
				{title}
			</h2>
			<div className="space-y-4">{children}</div>
			{footer && <div className="mt-6">{footer}</div>}
		</div>
	);
}
