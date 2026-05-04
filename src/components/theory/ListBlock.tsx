import type { TheoryBlock } from "#/content/schema";

interface ListBlockProps {
	block: Extract<TheoryBlock, { kind: "list" }>;
}

export function ListBlock({ block }: ListBlockProps) {
	// Items are static — use the text itself as key (unique within each list)
	const items = block.items.map((item) => (
		<li key={item} className="leading-relaxed">
			{item}
		</li>
	));

	if (block.ordered) {
		return (
			<ol className="my-4 list-decimal space-y-1 pl-6 text-[var(--c-fg)]">
				{items}
			</ol>
		);
	}

	return (
		<ul className="my-4 list-disc space-y-1 pl-6 text-[var(--c-fg)]">
			{items}
		</ul>
	);
}
