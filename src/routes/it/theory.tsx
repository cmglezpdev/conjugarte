import { createFileRoute } from "@tanstack/react-router";
import { TheoryRenderer } from "#/components/theory/TheoryRenderer";
import { loadTheory } from "#/lib/content";

export const Route = createFileRoute("/it/theory")({
	loader: () => loadTheory("it"),
	component: ItTheory,
});

function ItTheory() {
	const doc = Route.useLoaderData();
	return (
		<div className="mx-auto max-w-3xl">
			<TheoryRenderer doc={doc} lang="it" />
		</div>
	);
}
