import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/it/")({
	component: ItIndex,
});

function ItIndex() {
	return (
		<main>
			<h1>Italiano — Hub</h1>
		</main>
	);
}
