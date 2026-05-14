import { createFileRoute } from "@tanstack/react-router";
import { LevelRunnerFromSet } from "#/components/level/LevelRunner";
import { loadExercises } from "#/lib/content";
import { parseLevelSearch } from "#/lib/levelSearch";

export const Route = createFileRoute("/it/basic")({
	validateSearch: (search: Record<string, unknown>) => parseLevelSearch(search),
	loader: () => loadExercises("it", "basic", false),
	component: ItBasic,
});

function ItBasic() {
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
