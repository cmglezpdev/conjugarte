import type { Language, TheoryDoc } from "#/content/schema";
import { Example } from "./Example";
import { Heading } from "./Heading";
import { ListBlock } from "./ListBlock";
import { Note } from "./Note";
import { Paragraph } from "./Paragraph";
import { TableBlock } from "./TableBlock";

interface TheoryRendererProps {
	doc: TheoryDoc;
	lang?: Language;
}

// Derive a stable key from block content so React can efficiently reconcile.
// Theory docs are static — two blocks with identical kind+text are treated as
// the same node. The index suffix handles the rare duplicate case.
function blockKey(block: TheoryDoc["blocks"][number], i: number): string {
	switch (block.kind) {
		case "heading":
			return `h${block.level}-${block.text.slice(0, 20)}-${i}`;
		case "paragraph":
			return `p-${block.content[0]?.text.slice(0, 20) ?? i}-${i}`;
		case "example":
			return `ex-${block.text.slice(0, 20)}-${i}`;
		case "note":
			return `note-${block.text.slice(0, 20)}-${i}`;
		case "list":
			return `list-${block.ordered ? "ol" : "ul"}-${i}`;
		case "table":
			return `table-${block.headers[0]?.slice(0, 12) ?? i}-${i}`;
	}
}

/**
 * Renders a TheoryDoc by dispatching each block to the appropriate sub-component.
 */
export function TheoryRenderer({ doc, lang }: TheoryRendererProps) {
	const resolvedLang: Language = lang ?? doc.language;

	return (
		<article className="prose-conjugarte max-w-none">
			{doc.blocks.map((block, i) => {
				const key = blockKey(block, i);
				switch (block.kind) {
					case "heading":
						return <Heading key={key} block={block} />;
					case "paragraph":
						return <Paragraph key={key} block={block} />;
					case "example":
						return <Example key={key} block={block} lang={resolvedLang} />;
					case "note":
						return <Note key={key} block={block} />;
					case "list":
						return <ListBlock key={key} block={block} />;
					case "table":
						return <TableBlock key={key} block={block} />;
					default:
						return null;
				}
			})}
		</article>
	);
}
