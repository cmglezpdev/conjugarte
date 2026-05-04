import type { TheoryBlock } from "#/content/schema";

interface HeadingProps {
	block: Extract<TheoryBlock, { kind: "heading" }>;
}

const CLASSES: Record<1 | 2 | 3, string> = {
	1: "text-3xl font-bold tracking-tight text-[var(--c-fg)] mt-8 mb-4",
	2: "text-2xl font-semibold tracking-tight text-[var(--c-fg)] mt-6 mb-3",
	3: "text-xl font-semibold text-[var(--c-fg)] mt-5 mb-2",
};

export function Heading({ block }: HeadingProps) {
	const level = block.level as 1 | 2 | 3;
	const className = CLASSES[level];

	if (level === 1) return <h1 className={className}>{block.text}</h1>;
	if (level === 2) return <h2 className={className}>{block.text}</h2>;
	return <h3 className={className}>{block.text}</h3>;
}
