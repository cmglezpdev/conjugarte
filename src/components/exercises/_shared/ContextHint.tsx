interface ContextHintProps {
	text: string | undefined;
}

export function ContextHint({ text }: ContextHintProps) {
	if (!text) return null;
	return (
		<div
			data-testid="exercise-context-hint"
			className="mb-4 border-l-4 border-[var(--c-primary)] bg-[var(--c-card)] p-4 italic text-[var(--c-fg-muted)]"
		>
			{text.split("\n\n").map((chunk, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: stable split index
				<p key={i} className={i > 0 ? "mt-2" : ""}>
					{chunk}
				</p>
			))}
		</div>
	);
}
