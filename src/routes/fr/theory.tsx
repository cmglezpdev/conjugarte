import { createFileRoute } from "@tanstack/react-router";
import { TheoryRenderer } from "#/components/theory/TheoryRenderer";
import { loadTheory } from "#/lib/content";

export const Route = createFileRoute("/fr/theory")({
	loader: () => loadTheory("fr"),
	component: FrTheory,
});

function FrTheory() {
	const doc = Route.useLoaderData();
	return (
		<div className="mx-auto max-w-3xl">
			<TheoryRenderer doc={doc} lang="fr" />
		</div>
	);
}
