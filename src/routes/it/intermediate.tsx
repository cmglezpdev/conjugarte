import { createFileRoute } from "@tanstack/react-router";
import { LevelRunnerFromSet } from "#/components/level/LevelRunner";
import { loadExercises } from "#/lib/content";
import { parseLevelSearch } from "#/lib/levelSearch";

export const Route = createFileRoute("/it/intermediate")({
	validateSearch: (search: Record<string, unknown>) => parseLevelSearch(search),
	loader: () => loadExercises("it", "intermediate", false),
	component: ItIntermediate,
});

function ItIntermediate() {
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
