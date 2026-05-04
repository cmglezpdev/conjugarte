import { createFileRoute } from "@tanstack/react-router";
import { SectionHub } from "#/components/layout/SectionHub";

export const Route = createFileRoute("/fr/")({
	component: FrIndex,
});

function FrIndex() {
	return <SectionHub section="fr" />;
}
