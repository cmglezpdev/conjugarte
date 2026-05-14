import { createFileRoute } from "@tanstack/react-router";
import { LevelRunnerFromSet } from "#/components/level/LevelRunner";
import { loadExercises } from "#/lib/content";
import { parseLevelSearch } from "#/lib/levelSearch";

export const Route = createFileRoute("/fr/intermediate")({
	validateSearch: (search: Record<string, unknown>) => parseLevelSearch(search),
	loader: () => loadExercises("fr", "intermediate", false),
	component: FrIntermediate,
});

function FrIntermediate() {
	const exerciseSet = Route.useLoaderData();
	const { exercise, n } = Route.useSearch();
	return (
		<main className="p-6">
			<LevelRunnerFromSet
				exerciseSet={exerciseSet}
				initialExerciseId={exercise}
				initialNumber={n}
			/>
		</main>
	);
}
