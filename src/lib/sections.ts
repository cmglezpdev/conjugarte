// =====================================================================
// Single source of truth for section metadata.
// Labels here must match the JSON `title` fields under
// src/content/data/{lang}/{level}[-control].json — keep them in sync
// (validate-content.ts also checks structural integrity).
// =====================================================================

import type { Language, Level } from "#/content/schema";

export interface LevelEntry {
	/** Public label shown to the user (matches the JSON title). */
	label: string;
	/** Route path for the level's main exercises. */
	path: string;
	/** Number of exercises in the set — drives progress badges. */
	count: number;
	/** Generated exercise IDs that match the progress store keys. */
	ids: string[];
}

export interface LevelGroup {
	/** Slug used in URLs and as React key. */
	slug: Level;
	/** Heading for the level (Débutant / Intermédiaire / Avancé). */
	heading: string;
	exercises: LevelEntry;
	control: LevelEntry;
}

export interface SectionMeta {
	section: Language;
	/** Section name in its own language (e.g. "Français"). */
	label: string;
	theory: {
		label: string;
		path: string;
	};
	levels: LevelGroup[];
}

const LEVEL_HEADINGS: Record<Language, Record<Level, string>> = {
	fr: { basic: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" },
	it: {
		basic: "Principiante",
		intermediate: "Intermedio",
		advanced: "Avanzato",
	},
};

const CONTROL_LABEL: Record<Language, string> = {
	fr: "Exercices de contrôle",
	it: "Esercizi di controllo",
};

const THEORY: Record<Language, { label: string }> = {
	fr: { label: "À contretemps" },
	it: { label: "Questione di forme" },
};

const LEVEL_LABELS: Record<Language, Record<Level, string>> = {
	fr: {
		basic: "À toi le temps !",
		intermediate: "À chacun son temps",
		advanced: "Au fil du temps",
	},
	it: {
		basic: "Fai parlare il tempo",
		intermediate: "Il tempo non aspetta",
		advanced: "Gioca sul tempo",
	},
};

// Counts mirror src/content/data/{lang}/{level}[-control].json — update both
// together. validate-content.ts catches mismatches in CI.
const LEVEL_COUNTS: Record<
	Language,
	Record<Level, { main: number; control: number }>
> = {
	fr: {
		basic: { main: 17, control: 4 },
		intermediate: { main: 15, control: 4 },
		advanced: { main: 13, control: 4 },
	},
	it: {
		basic: { main: 17, control: 4 },
		intermediate: { main: 15, control: 4 },
		advanced: { main: 13, control: 4 },
	},
};

const SECTION_LABELS: Record<Language, string> = {
	fr: "Français",
	it: "Italiano",
};

function makeIds(
	lang: Language,
	level: Level,
	isControl: boolean,
	count: number,
): string[] {
	const suffix = isControl ? "-control" : "";
	return Array.from(
		{ length: count },
		(_, i) => `${lang}-${level}${suffix}-${i + 1}`,
	);
}

function buildSection(section: Language): SectionMeta {
	const levels: Level[] = ["basic", "intermediate", "advanced"];
	return {
		section,
		label: SECTION_LABELS[section],
		theory: {
			label: THEORY[section].label,
			path: `/${section}/theory`,
		},
		levels: levels.map((slug) => {
			const counts = LEVEL_COUNTS[section][slug];
			return {
				slug,
				heading: LEVEL_HEADINGS[section][slug],
				exercises: {
					label: LEVEL_LABELS[section][slug],
					path: `/${section}/${slug}`,
					count: counts.main,
					ids: makeIds(section, slug, false, counts.main),
				},
				control: {
					label: CONTROL_LABEL[section],
					path: `/${section}/${slug}/control`,
					count: counts.control,
					ids: makeIds(section, slug, true, counts.control),
				},
			};
		}),
	};
}

export const SECTION_META: Record<Language, SectionMeta> = {
	fr: buildSection("fr"),
	it: buildSection("it"),
};

export function getSectionMeta(section: Language): SectionMeta {
	return SECTION_META[section];
}
