import type { TheoryBlock } from "#/content/schema";

interface NoteProps {
	block: Extract<TheoryBlock, { kind: "note" }>;
}

export function Note({ block }: NoteProps) {
	return (
		<aside
			role="note"
			data-note
			className="my-4 flex gap-3 rounded-lg border border-[var(--c-partial)] bg-amber-50 px-4 py-3"
		>
			{/* AlertCircle icon (Lucide-style SVG) */}
			<svg
				className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<p className="text-sm leading-relaxed text-amber-900">{block.text}</p>
		</aside>
	);
}
