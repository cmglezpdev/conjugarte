import { motion } from "motion/react";
import { useReducer } from "react";
import type { AudioFillExercise } from "#/content/schema";
import { useAudio } from "#/lib/audio";
import { ExerciseCard } from "./_shared/ExerciseCard";
import { FeedbackOverlay } from "./_shared/FeedbackOverlay";
import { answersMatch } from "./_shared/normalize";
import type { ExerciseStatus } from "./_shared/useExerciseState";
import { VerifyButton } from "./_shared/VerifyButton";

// -----------------------------------------------------------------------
// Types — same answer shape as FillBlank
// -----------------------------------------------------------------------

type Answers = Record<number, Record<number, string>>;

interface State {
	status: ExerciseStatus;
	answers: Answers;
}

type Action =
	| { type: "set"; itemIdx: number; blankIdx: number; value: string }
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
		case "submit":
			return { ...state, status: action.outcome };
		case "reset":
			return { status: "idle", answers: {} };
	}
}

// -----------------------------------------------------------------------
// Sentence parser — shared logic with FillBlank (splits on {{N}})
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
// AudioPlayer sub-component
// -----------------------------------------------------------------------

interface AudioPlayerProps {
	audioUrl: string;
}

function AudioPlayer({ audioUrl }: AudioPlayerProps) {
	const { state, play, pause, replay } = useAudio(audioUrl);

	const isPlaying = state === "playing";
	const isError = state === "error";

	const handlePlayPause = async () => {
		if (isPlaying) {
			pause();
		} else {
			await play();
		}
	};

	if (isError) {
		return (
			<div
				data-testid="audio-error"
				className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--c-incorrect)]/40 bg-[var(--c-incorrect)]/5 p-3"
			>
				<span className="text-[var(--c-incorrect)]" aria-hidden="true">
					⚠
				</span>
				<span className="text-sm text-[var(--c-fg)]">
					No se pudo cargar el audio.
				</span>
				<button
					type="button"
					data-testid="audio-retry"
					className="ml-auto rounded-md border border-[var(--c-incorrect)]/40 px-3 py-1 text-xs font-medium text-[var(--c-incorrect)] hover:bg-[var(--c-incorrect)]/10 transition-colors"
					onClick={() => replay()}
				>
					Reintentar
				</button>
			</div>
		);
	}

	return (
		<div
			data-testid="audio-player"
			className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--c-border)] bg-[var(--c-card)] p-3"
		>
			{/* Play / Pause button */}
			<button
				type="button"
				data-testid="audio-play-pause"
				aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
				className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
					isPlaying
						? "bg-[var(--c-primary)] text-[var(--c-primary-fg)]"
						: "border border-[var(--c-border)] bg-[var(--c-card)] text-[var(--c-fg)] hover:border-[var(--c-primary)] hover:text-[var(--c-primary)]"
				}`}
				onClick={handlePlayPause}
			>
				{isPlaying ? (
					/* Pause icon */
					<svg
						aria-hidden="true"
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="currentColor"
					>
						<rect x="3" y="2" width="4" height="12" rx="1" />
						<rect x="9" y="2" width="4" height="12" rx="1" />
					</svg>
				) : (
					/* Play icon */
					<svg
						aria-hidden="true"
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="currentColor"
					>
						<path d="M4 2l10 6-10 6V2z" />
					</svg>
				)}
			</button>

			{/* Playing indicator */}
			<div className="flex flex-1 items-center gap-1.5">
				{isPlaying ? (
					<>
						<span className="text-xs font-medium text-[var(--c-primary)]">
							Reproduciendo…
						</span>
						<motion.span
							aria-hidden="true"
							className="inline-flex gap-0.5"
							data-testid="audio-playing-indicator"
						>
							{[0, 1, 2].map((i) => (
								<motion.span
									key={i}
									className="block h-3 w-0.5 rounded-full bg-[var(--c-primary)]"
									animate={{ scaleY: [1, 2, 1] }}
									transition={{
										duration: 0.6,
										repeat: Number.POSITIVE_INFINITY,
										delay: i * 0.15,
										ease: "easeInOut",
									}}
								/>
							))}
						</motion.span>
					</>
				) : (
					<span className="text-xs text-[var(--c-accent)]">
						Escucha el audio y completa los espacios
					</span>
				)}
			</div>

			{/* Replay button */}
			<button
				type="button"
				data-testid="audio-replay"
				aria-label="Reproducir de nuevo"
				className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--c-border)] text-[var(--c-accent)] hover:border-[var(--c-primary)] hover:text-[var(--c-primary)] transition-colors"
				onClick={() => replay()}
			>
				{/* Replay / rotate-ccw icon */}
				<svg
					aria-hidden="true"
					width="14"
					height="14"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M1 4.5A7 7 0 1 1 2.5 11" />
					<polyline points="1 1 1 5 5 5" />
				</svg>
			</button>
		</div>
	);
}

// -----------------------------------------------------------------------
// Motion variants (same as FillBlank)
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
// Props
// -----------------------------------------------------------------------

export interface AudioFillResult {
	score: number;
	correct: boolean;
}

interface Props {
	exercise: AudioFillExercise;
	onResult: (result: AudioFillResult) => void;
	onNext: () => void;
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

export function AudioFill({ exercise, onResult, onNext }: Props) {
	const [state, dispatch] = useReducer(reducer, {
		status: "idle",
		answers: {},
	});

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

	const animateKey = isSubmitted ? state.status : "idle";

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
			{/* Audio player */}
			<AudioPlayer audioUrl={exercise.audioUrl} />

			{/* Fill-blank items */}
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

								let inputBorderClass = "border-[var(--c-border)]";
								if (isSubmitted) {
									inputBorderClass = isCorrect
										? "border-[var(--c-correct)]"
										: "border-[var(--c-incorrect)]";
								}

								return (
									<span
										// biome-ignore lint/suspicious/noArrayIndexKey: stable
										key={segIdx}
										className="relative inline-flex flex-col items-center"
									>
										<input
											data-testid={`audio-fill-input-${itemIdx}-${blankIdx}`}
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
											className={`mx-1 inline-block w-24 rounded border px-2 py-0.5 text-center text-[var(--c-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] ${inputBorderClass}`}
											aria-label={`Blanco ${blankIdx + 1} del ítem ${itemIdx + 1}`}
										/>
										{hint && (
											<span className="absolute -bottom-5 text-xs text-[var(--c-accent)]">
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
		</ExerciseCard>
	);
}
