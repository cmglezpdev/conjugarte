import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { SectionLayout } from "#/components/layout/SectionLayout";

export const Route = createFileRoute("/it")({
	staticData: { section: "it" as const },
	component: ItLayout,
});

function ItLayout() {
	const { pathname } = useLocation();
	return (
		<SectionLayout section="it" pathname={pathname}>
			<Outlet />
		</SectionLayout>
	);
}
