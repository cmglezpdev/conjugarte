import { createFileRoute } from "@tanstack/react-router";
import { LevelRunnerFromSet } from "#/components/level/LevelRunner";
import { loadExercises } from "#/lib/content";

export const Route = createFileRoute("/fr/basic_/control")({
	loader: () => loadExercises("fr", "basic", true),
	component: FrBasicControl,
});

function FrBasicControl() {
	const exerciseSet = Route.useLoaderData();
	return (
		<main className="p-6">
			<LevelRunnerFromSet exerciseSet={exerciseSet} />
		</main>
	);
}
