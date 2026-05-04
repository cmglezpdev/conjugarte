import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { SectionLayout } from "#/components/layout/SectionLayout";

export const Route = createFileRoute("/fr")({
	staticData: { section: "fr" as const },
	component: FrLayout,
});

function FrLayout() {
	const { pathname } = useLocation();
	return (
		<SectionLayout section="fr" pathname={pathname}>
			<Outlet />
		</SectionLayout>
	);
}
