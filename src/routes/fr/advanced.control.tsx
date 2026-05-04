import { createFileRoute } from "@tanstack/react-router";
import { LevelRunnerFromSet } from "#/components/level/LevelRunner";
import { loadExercises } from "#/lib/content";

export const Route = createFileRoute("/fr/advanced/control")({
	loader: () => loadExercises("fr", "advanced", true),
	component: FrAdvancedControl,
});

function FrAdvancedControl() {
	const exerciseSet = Route.useLoaderData();
	return (
		<main className="p-6">
			<LevelRunnerFromSet exerciseSet={exerciseSet} />
		</main>
	);
}
