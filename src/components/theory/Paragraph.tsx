import type { TheoryBlock } from "#/content/schema";

interface ParagraphProps {
	block: Extract<TheoryBlock, { kind: "paragraph" }>;
}

export function Paragraph({ block }: ParagraphProps) {
	return (
		<p className="mb-4 leading-relaxed text-[var(--c-fg)]">
			{block.content.map((segment) => {
				// Use type+text as key — segments in a paragraph are static text nodes.
				const key = `${segment.type}-${segment.text.slice(0, 20)}`;
				if (segment.type === "emph") {
					return <em key={key}>{segment.text}</em>;
				}
				if (segment.type === "strong") {
					return <strong key={key}>{segment.text}</strong>;
				}
				return <span key={key}>{segment.text}</span>;
			})}
		</p>
	);
}
