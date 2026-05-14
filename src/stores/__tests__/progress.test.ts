import { describe, expect, it } from "vitest";
import { migrate, ORPHANED_IDS } from "#/stores/progress";

const makeExerciseProgress = () => ({
	status: "completed" as const,
	attempts: 2,
	lastScore: 1,
	lastAttemptAt: "2026-01-01T00:00:00.000Z",
});

describe("progress store migrate v1 -> v2", () => {
	it("strips it-intermediate-3 from v1 state", () => {
		const v1 = {
			version: 1 as const,
			byExerciseId: {
				"it-intermediate-3": makeExerciseProgress(),
				"fr-basic-1": makeExerciseProgress(),
			},
		};
		const v2 = migrate(v1, 1);
		expect(v2.byExerciseId["it-intermediate-3"]).toBeUndefined();
		expect(v2.byExerciseId["fr-basic-1"]).toBeDefined();
		expect(v2.version).toBe(2);
	});

	it("strips it-intermediate-13 from v1 state", () => {
		const v1 = {
			version: 1 as const,
			byExerciseId: {
				"it-intermediate-13": makeExerciseProgress(),
				"it-intermediate-4": makeExerciseProgress(),
			},
		};
		const v2 = migrate(v1, 1);
		expect(v2.byExerciseId["it-intermediate-13"]).toBeUndefined();
		expect(v2.byExerciseId["it-intermediate-4"]).toBeDefined();
	});

	it("strips it-basic-14 from v1 state", () => {
		const v1 = {
			version: 1 as const,
			byExerciseId: {
				"it-basic-14": makeExerciseProgress(),
				"it-basic-15": makeExerciseProgress(),
			},
		};
		const v2 = migrate(v1, 1);
		expect(v2.byExerciseId["it-basic-14"]).toBeUndefined();
		expect(v2.byExerciseId["it-basic-15"]).toBeDefined();
	});

	it("passes through non-orphan keys unchanged", () => {
		const v1 = {
			version: 1 as const,
			byExerciseId: {
				"fr-basic-1": makeExerciseProgress(),
				"it-advanced-5": makeExerciseProgress(),
			},
		};
		const v2 = migrate(v1, 1);
		expect(v2.byExerciseId["fr-basic-1"]).toBeDefined();
		expect(v2.byExerciseId["it-advanced-5"]).toBeDefined();
		expect(Object.keys(v2.byExerciseId)).toHaveLength(2);
	});

	it("returns default v2 state when persisted is null", () => {
		const v2 = migrate(null, 0);
		expect(v2.version).toBe(2);
		expect(v2.byExerciseId).toEqual({});
	});

	it("ORPHANED_IDS contains the three split exercise IDs", () => {
		expect(ORPHANED_IDS).toContain("it-intermediate-3");
		expect(ORPHANED_IDS).toContain("it-intermediate-13");
		expect(ORPHANED_IDS).toContain("it-basic-14");
	});
});
