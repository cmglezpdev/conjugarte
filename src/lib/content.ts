import { createServerFn } from "@tanstack/react-start";
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

const _loadLanding = createServerFn({ method: "GET" }).handler(async () => {
	return Landing.parse(readJson("landing.json"));
});

const _loadTheory = createServerFn({ method: "GET" })
	.inputValidator((lang: Language) => lang)
	.handler(async ({ data: lang }) => {
		return TheoryDoc.parse(readJson(`${lang}/theory.json`));
	});

const _loadExercises = createServerFn({ method: "GET" })
	.inputValidator(
		(input: { lang: Language; level: Level; isControl: boolean }) => input,
	)
	.handler(async ({ data }) => {
		const file = `${data.lang}/${data.level}${data.isControl ? "-control" : ""}.json`;
		return ExerciseSet.parse(readJson(file));
	});

export const loadLanding = (): Promise<Landing> => _loadLanding();

export const loadTheory = (lang: Language): Promise<TheoryDoc> =>
	_loadTheory({ data: lang });

export const loadExercises = (
	lang: Language,
	level: Level,
	isControl: boolean,
): Promise<ExerciseSet> => _loadExercises({ data: { lang, level, isControl } });
