import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
	ExerciseSet,
	Landing,
	type Language,
	type Level,
	TheoryDoc,
} from "#/content/schema";

const DATA_DIR = resolve(process.cwd(), "src", "content", "data");

const readJson = async (rel: string): Promise<unknown> => {
	const raw = await readFile(resolve(DATA_DIR, rel), "utf8");
	return JSON.parse(raw);
};

const _loadLanding = createServerFn({ method: "GET" }).handler(async () => {
	return Landing.parse(await readJson("landing.json"));
});

const _loadTheory = createServerFn({ method: "GET" })
	.inputValidator((lang: Language) => lang)
	.handler(async ({ data: lang }) => {
		return TheoryDoc.parse(await readJson(`${lang}/theory.json`));
	});

const _loadExercises = createServerFn({ method: "GET" })
	.inputValidator(
		(input: { lang: Language; level: Level; isControl: boolean }) => input,
	)
	.handler(async ({ data }) => {
		const file = `${data.lang}/${data.level}${data.isControl ? "-control" : ""}.json`;
		return ExerciseSet.parse(await readJson(file));
	});

export const loadLanding = (): Promise<Landing> => _loadLanding();

export const loadTheory = (lang: Language): Promise<TheoryDoc> =>
	_loadTheory({ data: lang });

export const loadExercises = (
	lang: Language,
	level: Level,
	isControl: boolean,
): Promise<ExerciseSet> =>
	_loadExercises({ data: { lang, level, isControl } });
