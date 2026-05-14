import { describe, expect, it } from "vitest";
import { ExerciseSet } from "#/content/schema";

import frBasic from "#/content/data/fr/basic.json";
import frBasicControl from "#/content/data/fr/basic-control.json";
import frIntermediate from "#/content/data/fr/intermediate.json";
import frIntermediateControl from "#/content/data/fr/intermediate-control.json";
import frAdvanced from "#/content/data/fr/advanced.json";
import frAdvancedControl from "#/content/data/fr/advanced-control.json";
import itBasic from "#/content/data/it/basic.json";
import itBasicControl from "#/content/data/it/basic-control.json";
import itIntermediate from "#/content/data/it/intermediate.json";
import itIntermediateControl from "#/content/data/it/intermediate-control.json";
import itAdvanced from "#/content/data/it/advanced.json";
import itAdvancedControl from "#/content/data/it/advanced-control.json";

const datasets: Array<[string, unknown]> = [
	["fr/basic", frBasic],
	["fr/basic-control", frBasicControl],
	["fr/intermediate", frIntermediate],
	["fr/intermediate-control", frIntermediateControl],
	["fr/advanced", frAdvanced],
	["fr/advanced-control", frAdvancedControl],
	["it/basic", itBasic],
	["it/basic-control", itBasicControl],
	["it/intermediate", itIntermediate],
	["it/intermediate-control", itIntermediateControl],
	["it/advanced", itAdvanced],
	["it/advanced-control", itAdvancedControl],
];

describe("ExerciseSet data files", () => {
	for (const [name, data] of datasets) {
		it(`${name}.json validates against ExerciseSet schema`, () => {
			const result = ExerciseSet.safeParse(data);
			if (!result.success) {
				console.error(
					`${name} validation failed:`,
					JSON.stringify(result.error.issues, null, 2),
				);
			}
			expect(result.success).toBe(true);
		});

		it(`${name}.json has placeholder count matching blanks/choices`, () => {
			const set = ExerciseSet.parse(data);
			for (const ex of set.exercises) {
				if (ex.kind === "fill-blank" || ex.kind === "audio-fill") {
					for (const item of ex.items) {
						const placeholders = [
							...item.sentence.matchAll(/\{\{(\d+)\}\}/g),
						].map((m) => Number(m[1]));
						const max =
							placeholders.length > 0 ? Math.max(...placeholders) : -1;
						expect(
							item.blanks.length,
							`${name} ex ${ex.number} sentence "${item.sentence.slice(0, 60)}..." expected ${max + 1} blanks, got ${item.blanks.length}`,
						).toBe(max + 1);
					}
				}
				if (ex.kind === "inline-choice") {
					for (const item of ex.items) {
						const placeholders = [
							...item.sentence.matchAll(/\{\{(\d+)\}\}/g),
						].map((m) => Number(m[1]));
						const max =
							placeholders.length > 0 ? Math.max(...placeholders) : -1;
						expect(
							item.choices.length,
							`${name} ex ${ex.number} sentence "${item.sentence.slice(0, 60)}..." expected ${max + 1} choices, got ${item.choices.length}`,
						).toBe(max + 1);
					}
				}
			}
		});
	}
});
