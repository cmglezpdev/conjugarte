import { createFileRoute } from "@tanstack/react-router";
import { LevelRunnerFromSet } from "#/components/level/LevelRunner";
import { loadExercises } from "#/lib/content";

export const Route = createFileRoute("/it/basic/control")({
	loader: () => loadExercises("it", "basic", true),
	component: ItBasicControl,
});

function ItBasicControl() {
	const exerciseSet = Route.useLoaderData();
	return (
		<main className="p-6">
			<LevelRunnerFromSet exerciseSet={exerciseSet} />
		</main>
	);
}
