import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	useMatches,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { HydrationGate } from "#/components/layout/HydrationGate";
import { UpdateToast } from "#/components/layout/UpdateToast";

const SITE_URL = "https://conjugarte.vercel.app";
const OG_IMAGE = `${SITE_URL}/cover.png`;
const TITLE = "ConjugArte — Temps composés & tempi composti";
const DESCRIPTION =
	"Application web pour apprendre les temps composés du français et de l’italien — Web app per imparare i tempi composti del francese e dell’italiano";
const KEYWORDS =
	"temps composés, passé composé, plus-que-parfait, futur antérieur, tempi composti, passato prossimo, trapassato prossimo, futuro anteriore, français, italiano, grammaire, grammatica";
const OG_IMAGE_ALT = "ConjugArte — Temps composés & tempi composti";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			{ name: "keywords", content: KEYWORDS },
			{ name: "author", content: "ConjugArte" },
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: "ConjugArte" },
			{ property: "og:title", content: TITLE },
			{ property: "og:description", content: DESCRIPTION },
			{ property: "og:url", content: SITE_URL },
			{ property: "og:image", content: OG_IMAGE },
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "630" },
			{ property: "og:image:alt", content: OG_IMAGE_ALT },
			{ property: "og:locale", content: "fr_FR" },
			{ property: "og:locale:alternate", content: "it_IT" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: TITLE },
			{ name: "twitter:description", content: DESCRIPTION },
			{ name: "twitter:image", content: OG_IMAGE },
			{ name: "twitter:image:alt", content: OG_IMAGE_ALT },
		],
		links: [{ rel: "canonical", href: SITE_URL }],
	}),
	component: RootComponent,
});

function RootComponent() {
	const matches = useMatches();

	// Derive section from the deepest matched route that declares staticData.section.
	const section = matches
		.map(
			(m) => (m.staticData as { section?: "fr" | "it" } | undefined)?.section,
		)
		.filter((s): s is "fr" | "it" => s === "fr" || s === "it")
		.at(-1);

	useEffect(() => {
		const html = document.documentElement;
		if (section) {
			html.setAttribute("data-section", section);
			html.setAttribute("lang", section);
		} else {
			html.removeAttribute("data-section");
			html.setAttribute("lang", "fr");
		}
	}, [section]);

	return (
		<>
			<HeadContent />
			<HydrationGate>
				<Outlet />
			</HydrationGate>
			<UpdateToast />
			<TanStackDevtools
				config={{ position: "bottom-right" }}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
		</>
	);
}
