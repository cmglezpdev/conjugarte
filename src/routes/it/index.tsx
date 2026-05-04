import { createFileRoute } from "@tanstack/react-router";
import { SectionHub } from "#/components/layout/SectionHub";

export const Route = createFileRoute("/it/")({
	component: ItIndex,
});

function ItIndex() {
	return <SectionHub section="it" />;
}
