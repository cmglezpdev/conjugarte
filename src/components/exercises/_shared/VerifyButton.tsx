import type { ExerciseStatus } from "./useExerciseState";

interface VerifyButtonProps {
	status: ExerciseStatus;
	onVerify: () => void;
	onNext: () => void;
	disabled?: boolean;
}

const isSubmitted = (s: ExerciseStatus): boolean =>
	s === "correct" || s === "incorrect" || s === "partial" || s === "submitted";

export function VerifyButton({
	status,
	onVerify,
	onNext,
	disabled,
}: VerifyButtonProps) {
	const submitted = isSubmitted(status);
	const label = submitted ? "Continuar" : "Verificar";

	const baseClass =
		"w-full rounded-lg px-6 py-3 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

	const colorClass = submitted
		? "bg-[var(--color-correct)] text-white hover:opacity-90"
		: "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90";

	return (
		<button
			type="button"
			data-testid="verify-button"
			className={`${baseClass} ${colorClass}`}
			disabled={disabled && !submitted}
			onClick={submitted ? onNext : onVerify}
		>
			{label}
		</button>
	);
}
