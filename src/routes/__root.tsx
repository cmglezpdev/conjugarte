import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Scripts,
	useMatches,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { HydrationGate } from "#/components/layout/HydrationGate";

import appCss from "../styles.css?url";

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
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			{ name: "keywords", content: KEYWORDS },
			{ name: "author", content: "ConjugArte" },
			{ name: "theme-color", content: "#000000" },
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
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.ico" },
			{ rel: "apple-touch-icon", href: "/logo192.png" },
			{ rel: "manifest", href: "/manifest.json" },
			{ rel: "canonical", href: SITE_URL },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const matches = useMatches();

	// Derive section from the deepest matched route that declares staticData.section.
	// This runs on both server and client, so data-section is serialized in the initial
	// HTML — no flash of the wrong palette.
	const section = matches
		.map(
			(m) => (m.staticData as { section?: "fr" | "it" } | undefined)?.section,
		)
		.filter((s): s is "fr" | "it" => s === "fr" || s === "it")
		.at(-1);

	return (
		<html
			lang={section ?? "fr"}
			data-section={section}
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
			</head>
			<body className="font-sans antialiased">
				<HydrationGate>{children}</HydrationGate>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
