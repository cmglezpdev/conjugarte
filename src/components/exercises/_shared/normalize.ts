/**
 * normalizeAnswer — canonical string normalization for exercise answer comparison.
 *
 * Applies: lowercase, trim, collapse-whitespace.
 * Preserves accented/diacritic characters (accent-insensitive comparison is opt-in
 * via the `stripAccents` option, not used in Phase 2).
 */
export function normalizeAnswer(
	s: string,
	opts?: { stripAccents?: boolean },
): string {
	let result = s.toLowerCase().replace(/\s+/g, " ").trim();
	if (opts?.stripAccents) {
		result = result.normalize("NFD").replace(/[̀-ͯ]/g, "");
	}
	return result;
}

/**
 * answersMatch — compare a user's answer against one or more accepted answers.
 * `expected` may be a single string or an array of accepted strings.
 */
export function answersMatch(
	userAnswer: string,
	expected: string | string[],
): boolean {
	const normalized = normalizeAnswer(userAnswer);
	if (Array.isArray(expected)) {
		return expected.some((a) => normalizeAnswer(a) === normalized);
	}
	return normalizeAnswer(expected) === normalized;
}
