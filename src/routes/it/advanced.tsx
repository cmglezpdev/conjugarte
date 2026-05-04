import { createFileRoute } from "@tanstack/react-router";
import { LevelRunnerFromSet } from "#/components/level/LevelRunner";
import { loadExercises } from "#/lib/content";

export const Route = createFileRoute("/it/advanced")({
	loader: () => loadExercises("it", "advanced", false),
	component: ItAdvanced,
});

function ItAdvanced() {
	const exerciseSet = Route.useLoaderData();
	return (
		<main className="p-6">
			<LevelRunnerFromSet exerciseSet={exerciseSet} />
		</main>
	);
}
