import { useReducer } from "react";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export type ExerciseStatus =
	| "idle"
	| "answering"
	| "submitted"
	| "correct"
	| "incorrect"
	| "partial";

export interface ExerciseState<TAnswer> {
	status: ExerciseStatus;
	answer: TAnswer;
	attempts: number;
}

export type ExerciseAction<TAnswer> =
	| { type: "set"; answer: TAnswer }
	| { type: "submit"; outcome: "correct" | "incorrect" | "partial" }
	| { type: "reset" };

// -----------------------------------------------------------------------
// Reducer
// -----------------------------------------------------------------------

function makeReducer<TAnswer>(initial: TAnswer) {
	return function reducer(
		state: ExerciseState<TAnswer>,
		action: ExerciseAction<TAnswer>,
	): ExerciseState<TAnswer> {
		switch (action.type) {
			case "set":
				return { ...state, status: "answering", answer: action.answer };
			case "submit":
				return {
					...state,
					status: action.outcome,
					attempts: state.attempts + 1,
				};
			case "reset":
				return { status: "idle", answer: initial, attempts: 0 };
		}
	};
}

// -----------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------

export function useExerciseState<TAnswer>(
	initialAnswer: TAnswer,
): [ExerciseState<TAnswer>, React.Dispatch<ExerciseAction<TAnswer>>] {
	return useReducer(makeReducer(initialAnswer), {
		status: "idle",
		answer: initialAnswer,
		attempts: 0,
	});
}
