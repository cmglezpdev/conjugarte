import { createFileRoute } from "@tanstack/react-router";
import { LandingHero } from "#/components/layout/LandingHero";
import { loadLanding } from "#/lib/content";

export const Route = createFileRoute("/")({
	loader: () => loadLanding(),
	component: LandingPage,
});

function LandingPage() {
	const data = Route.useLoaderData();
	return (
		<main className="min-h-screen px-4 pb-16 pt-8">
			<LandingHero data={data} />
		</main>
	);
}
