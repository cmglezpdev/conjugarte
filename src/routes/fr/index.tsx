import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fr/")({
	component: FrIndex,
});

function FrIndex() {
	return (
		<main>
			<h1>Français — Hub</h1>
		</main>
	);
}
