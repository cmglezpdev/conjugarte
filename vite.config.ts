import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		tailwindcss(),
		viteReact(),
		VitePWA({
			registerType: "prompt",
			includeAssets: [
				"favicon.ico",
				"logo192.png",
				"logo512.png",
				"cover.png",
				"robots.txt",
				"audio/it-advanced-1.m4a",
			],
			manifest: {
				name: "ConjugArte — Temps composés & tempi composti",
				short_name: "ConjugArte",
				description:
					"Application web pour apprendre les temps composés du français et de l'italien — Web app per imparare i tempi composti del francese e dell'italiano",
				start_url: "/",
				display: "standalone",
				theme_color: "#000000",
				background_color: "#ffffff",
				lang: "fr",
				icons: [
					{
						src: "/favicon.ico",
						sizes: "64x64 32x32 24x24 16x16",
						type: "image/x-icon",
					},
					{ src: "/logo192.png", sizes: "192x192", type: "image/png" },
					{
						src: "/logo512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
			workbox: {
				globPatterns: [
					"**/*.{js,css,html,ico,png,svg,woff2,m4a,json,txt,webmanifest}",
				],
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				navigateFallback: "/index.html",
				cleanupOutdatedCaches: true,
			},
		}),
	],
});

export default config;
