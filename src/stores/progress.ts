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
	state: ProgressStateV1,
	ids: ReadonlyArray<string>,
): number =>
	ids.filter((id) => state.byExerciseId[id]?.status === "completed").length;

// -----------------------------------------------------------------------
// Default state
// -----------------------------------------------------------------------

const defaultStateV1: ProgressStateV1 = {
	version: 1,
	byExerciseId: {},
};

// -----------------------------------------------------------------------
// Migration
// -----------------------------------------------------------------------

const migrate = (persisted: unknown, fromVersion: number): ProgressStateV1 => {
	if (fromVersion === 0 || persisted == null) return defaultStateV1;
	if (fromVersion === 1) return persisted as ProgressStateV1;
	// Future versions: add migration branches here before removing old ones.
	return defaultStateV1;
};

// -----------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------

export const useProgress = create<ProgressStateV1 & ProgressActions>()(
	persist(
		(set) => ({
			...defaultStateV1,

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
			version: 1,
			skipHydration: true,
			migrate,
			partialize: (s) => ({ version: s.version, byExerciseId: s.byExerciseId }),
		},
	),
);
