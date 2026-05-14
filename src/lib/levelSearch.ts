export type LevelSearch = {
	/** Exercise `id` from JSON, e.g. `it-basic-14` */
	exercise?: string;
	/** Exercise `number` from JSON (recommended), or 1-based position in the list if no match */
	n?: number;
};

export function parseLevelSearch(search: Record<string, unknown>): LevelSearch {
	let exercise: string | undefined;
	if (typeof search.exercise === "string") {
		const t = search.exercise.trim();
		if (t) exercise = t;
	}

	let n: number | undefined;
	const raw = search.n;
	if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1) {
		n = raw;
	} else if (typeof raw === "string") {
		const parsed = Number.parseInt(raw, 10);
		if (!Number.isNaN(parsed) && parsed >= 1) n = parsed;
	}

	return { exercise, n };
}
