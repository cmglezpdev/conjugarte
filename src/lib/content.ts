import {
	ExerciseSet,
	Landing,
	type Language,
	type Level,
	TheoryDoc,
} from "#/content/schema";

const dataModules = import.meta.glob("../content/data/**/*.json", {
	eager: true,
	import: "default",
}) as Record<string, unknown>;

const readJson = (rel: string): unknown => {
	const key = `../content/data/${rel}`;
	const data = dataModules[key];
	if (!data) {
		throw new Error(`Content file not found: ${rel}`);
	}
	return data;
};

export const loadLanding = (): Promise<Landing> =>
	Promise.resolve(Landing.parse(readJson("landing.json")));

export const loadTheory = (lang: Language): Promise<TheoryDoc> =>
	Promise.resolve(TheoryDoc.parse(readJson(`${lang}/theory.json`)));

export const loadExercises = (
	lang: Language,
	level: Level,
	isControl: boolean,
): Promise<ExerciseSet> => {
	const file = `${lang}/${level}${isControl ? "-control" : ""}.json`;
	return Promise.resolve(ExerciseSet.parse(readJson(file)));
};
