// @ts-check

import starlight from "@astrojs/starlight";
import starlightCatppuccin from "@catppuccin/starlight";
import { defineConfig, fontProviders } from "astro/config";
import starlightLinksValidator from "starlight-links-validator";

/* https://docs.netlify.com/configure-builds/environment-variables/#read-only-variables */
const NETLIFY_PREVIEW_SITE =
	process.env.CONTEXT !== "production" && process.env.DEPLOY_PRIME_URL;

const site = NETLIFY_PREVIEW_SITE || "https://leturgero.web-runes.dev/";

// https://astro.build/config
export default defineConfig({
	site,
	trailingSlash: "always",
	integrations: [
		starlight({
			title: "Leturgerð",
			description: "Web fonts, made simple.",
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/web-runes/leturgero",
				},
			],
			sidebar: [
				{
					label: "Getting started",
					items: ["quick-start", "philosophy", "usage"],
				},
				{
					label: "Reference",
					items: [{ autogenerate: { directory: "reference" } }],
				},
			],
			customCss: ["./src/styles/custom.css"],
			components: {
				Head: "./src/components/starlight/Head.astro",
			},
			credits: true,
			editLink: {
				baseUrl: "https://github.com/web-runes/leturgero/tree/main/docs",
			},
			lastUpdated: true,
			plugins: [
				starlightCatppuccin({
					light: {
						accent: "maroon",
					},
					dark: {
						flavor: "mocha",
						accent: "red",
					},
				}),
				starlightLinksValidator(),
			],
		}),
	],
	fonts: [
		{
			name: "Source Serif Pro",
			cssVariable: "--font-source-serif-pro",
			provider: fontProviders.fontsource(),
			weights: ["600"],
			styles: ["normal"],
			subsets: ["latin"],
			fallbacks: ["serif"],
		},
		{
			name: "Switzer",
			cssVariable: "--font-switzer",
			provider: fontProviders.fontshare(),
			weights: ["400", "600", "700"],
			styles: ["normal"],
			subsets: ["latin"],
			fallbacks: ["sans-serif"],
		},
		{
			name: "IBM Plex Mono",
			cssVariable: "--font-ibm-plex-mono",
			provider: fontProviders.fontsource(),
			weights: ["400"],
			styles: ["normal"],
			subsets: ["latin"],
			fallbacks: ["monospace"],
		},
	],
});
