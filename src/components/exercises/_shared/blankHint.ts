/** True if `hint` repeats an infinitive already shown in parentheses in the sentence. */
export function hintDuplicatesParenthetical(
	sentence: string,
	hint: string | undefined,
): boolean {
	if (!hint?.trim()) return false;
	const h = normalizeVerbHint(hint);
	for (const inner of parentheticalInners(sentence)) {
		if (normalizeVerbHint(inner) === h) return true;
		const parts = inner.split(/\s*-\s*/).map((p) => normalizeVerbHint(p));
		if (parts.some((p) => p === h && p.length > 0)) return true;
	}
	return false;
}

function normalizeVerbHint(s: string): string {
	return s.trim().toLowerCase().normalize("NFC");
}

function parentheticalInners(sentence: string): string[] {
	const out: string[] = [];
	const re = /\(([^)]*)\)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(sentence)) !== null) {
		const inner = m[1]?.trim();
		if (inner) out.push(inner);
	}
	return out;
}
