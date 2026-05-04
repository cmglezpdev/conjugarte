import type { TheoryBlock } from "#/content/schema";

interface TableBlockProps {
	block: Extract<TheoryBlock, { kind: "table" }>;
}

export function TableBlock({ block }: TableBlockProps) {
	return (
		<div className="my-4 overflow-x-auto rounded-lg border border-[var(--c-border)]">
			<table className="min-w-full border-collapse text-sm">
				<thead className="bg-[var(--c-card)]">
					<tr>
						{block.headers.map((header) => (
							<th
								key={header}
								className="border-b border-[var(--c-border)] px-4 py-2.5 text-left font-semibold text-[var(--c-fg)]"
							>
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{block.rows.map((row, ri) => {
						// Derive a stable key from first cell + index — table rows are static.
						const rowKey = `row-${row[0]?.slice(0, 10) ?? ri}-${ri}`;
						return (
							<tr key={rowKey} className="even:bg-[var(--c-card)]">
								{row.map((cell) => (
									<td
										key={cell}
										className="border-b border-[var(--c-border)] px-4 py-2 text-[var(--c-fg)] last:border-b-0"
									>
										{cell}
									</td>
								))}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
