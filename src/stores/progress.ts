import { create } from "zustand";
import { persist } from "zustand/middleware";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export type ExerciseStatus = "not-started" | "in-progress" | "completed";

export type ExerciseProgress = {
	status: ExerciseStatus;
	attempts: number;
	lastScore: number; // 0..1
	lastAttemptAt: string; // ISO 8601
};

export type ProgressStateV1 = {
	version: 1;
	byExerciseId: Record<string, ExerciseProgress>;
};

export type ProgressStateV2 = {
	version: 2;
	byExerciseId: Record<string, ExerciseProgress>;
};

export type ProgressActions = {
	recordResult: (id: string, score: number) => void;
	resetExercise: (id: string) => void;
	resetLevel: (ids: ReadonlyArray<string>) => void;
	/** Remove all entries whose IDs start with `{lang}-` (resets an entire section). */
	resetSection: (lang: "fr" | "it") => void;
	resetAll: () => void;
};

// -----------------------------------------------------------------------
// Selector
// -----------------------------------------------------------------------

export const selectCompletedCount = (
	state: ProgressStateV2,
	ids: ReadonlyArray<string>,
): number =>
	ids.filter((id) => state.byExerciseId[id]?.status === "completed").length;

// -----------------------------------------------------------------------
// Default state
// -----------------------------------------------------------------------

const defaultStateV2: ProgressStateV2 = {
	version: 2,
	byExerciseId: {},
};

// -----------------------------------------------------------------------
// Migration
// -----------------------------------------------------------------------

export const ORPHANED_IDS = [
	"it-intermediate-3",
	"it-intermediate-13",
	"it-basic-14",
] as const;

export const migrate = (
	persisted: unknown,
	fromVersion: number,
): ProgressStateV2 => {
	if (fromVersion === 0 || persisted == null) return defaultStateV2;
	if (fromVersion === 1) {
		const v1 = persisted as ProgressStateV1;
		const filtered = { ...v1.byExerciseId };
		for (const id of ORPHANED_IDS) delete filtered[id];
		return { version: 2, byExerciseId: filtered };
	}
	if (fromVersion === 2) return persisted as ProgressStateV2;
	return defaultStateV2;
};

// -----------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------

export const useProgress = create<ProgressStateV2 & ProgressActions>()(
	persist(
		(set) => ({
			...defaultStateV2,

			recordResult: (id, score) =>
				set((s) => {
					const prev = s.byExerciseId[id];
					return {
						byExerciseId: {
							...s.byExerciseId,
							[id]: {
								status: score >= 1 ? "completed" : "in-progress",
								attempts: (prev?.attempts ?? 0) + 1,
								lastScore: score,
								lastAttemptAt: new Date().toISOString(),
							},
						},
					};
				}),

			resetExercise: (id) =>
				set((s) => {
					const { [id]: _removed, ...rest } = s.byExerciseId;
					return { byExerciseId: rest };
				}),

			resetLevel: (ids) =>
				set((s) => {
					const next = { ...s.byExerciseId };
					for (const id of ids) {
						delete next[id];
					}
					return { byExerciseId: next };
				}),

			resetSection: (lang) =>
				set((s) => {
					const prefix = `${lang}-`;
					const next: typeof s.byExerciseId = {};
					for (const [id, progress] of Object.entries(s.byExerciseId)) {
						if (!id.startsWith(prefix)) next[id] = progress;
					}
					return { byExerciseId: next };
				}),

			resetAll: () => set({ byExerciseId: {} }),
		}),
		{
			name: "conjugarte-progress",
			version: 2,
			skipHydration: true,
			migrate,
			partialize: (s) => ({ version: s.version, byExerciseId: s.byExerciseId }),
		},
	),
);
