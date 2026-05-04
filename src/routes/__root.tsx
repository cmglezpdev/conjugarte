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

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "ConjugArte",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
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
		<html lang="es" data-section={section} suppressHydrationWarning>
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
