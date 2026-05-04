import { AnimatePresence, motion } from "motion/react";
import type { ExerciseStatus } from "./useExerciseState";

interface FeedbackOverlayProps {
	status: ExerciseStatus;
}

const feedbackConfig: Partial<
	Record<ExerciseStatus, { icon: string; message: string; color: string }>
> = {
	correct: {
		icon: "✓",
		message: "¡Correcto!",
		color: "text-[var(--color-correct)]",
	},
	incorrect: {
		icon: "✗",
		message: "Incorrecto",
		color: "text-[var(--color-incorrect)]",
	},
	partial: {
		icon: "~",
		message: "Parcialmente correcto",
		color: "text-[var(--color-partial)]",
	},
};

export function FeedbackOverlay({ status }: FeedbackOverlayProps) {
	const config = feedbackConfig[status];

	return (
		<AnimatePresence>
			{config && (
				<motion.div
					key={status}
					className={`flex items-center gap-2 font-semibold ${config.color}`}
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -4 }}
					transition={{ duration: 0.2 }}
					data-testid="feedback-overlay"
				>
					<span className="text-xl" aria-hidden="true">
						{config.icon}
					</span>
					<span>{config.message}</span>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
