import { useState } from "react";
import type { Language, TheoryBlock } from "#/content/schema";

interface ExampleProps {
	block: Extract<TheoryBlock, { kind: "example" }>;
	lang: Language;
}

const LABEL: Record<Language, string> = {
	fr: "Ej.:",
	it: "Es.:",
};

const TRANSLATION_LABEL: Record<Language, string> = {
	fr: "Ver traducción",
	it: "Ver traduzione",
};

export function Example({ block, lang }: ExampleProps) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div
			className="my-4 border-l-4 border-[var(--c-primary)] bg-[var(--c-card)] px-4 py-3 rounded-r-lg"
			data-example
		>
			<p className="mb-1 text-sm font-semibold text-[var(--c-primary)]">
				{LABEL[lang]}
			</p>
			<p className="italic text-[var(--c-fg)]">{block.text}</p>
			{block.translation && (
				<div className="mt-2">
					<button
						type="button"
						className="text-xs font-medium text-[var(--c-accent)] underline-offset-2 hover:underline"
						onClick={() => setExpanded((v) => !v)}
					>
						{TRANSLATION_LABEL[lang]}
					</button>
					{expanded && (
						<p className="mt-1 text-sm text-[var(--c-fg)] opacity-80">
							{block.translation}
						</p>
					)}
				</div>
			)}
		</div>
	);
}
