import { lstatSync, type Stats } from "node:fs";
import { updateSettings } from "@clack/prompts";
import { cli, define } from "gunshi";
import { getAgentProfile } from "gunshi/agent";
import type { FontStyles } from "unifont";
import pkg from "../package.json" with { type: "json" };
import type { FontFormat } from "./types.js";

// TODO: properly abstract commands
// TODO: test flow as human
// TODO: test flow as agent
// TODO: review all texts again

const agent = getAgentProfile().isAgent;

if (agent) {
	updateSettings({ withGuide: false });
}

// TODO: extract validation? avoid duplication

function isFontStyle(style: string): style is FontStyles {
	return (["normal", "italic", "oblique"] satisfies Array<FontStyles>).includes(
		style as any,
	);
}

function isFontFormat(format: string): format is FontFormat {
	return (
		["eot", "otf", "ttf", "woff", "woff2"] satisfies Array<FontFormat>
	).includes(format as any);
}

// TODO: consider moving validation to functions directly and only keep parsing here

const main = define({
	args: {
		"public-dir": {
			type: "string",
			description: "TODO:",
			parse: (value) => {
				let stats: Stats;
				try {
					stats = lstatSync(value);
				} catch {
					throw new Error("Path does not exist");
				}
				if (!stats.isDirectory()) {
					throw new Error("Not a directory");
				}
				return value;
			},
		},
		"public-fonts-dir": {
			type: "string",
			description: "TODO:",
			parse: (value) => {
				if (value.match(/[^\x20-\x7E]/g) !== null)
					throw new Error("Invalid non-printable character present!");
				return value;
			},
		},
		"styles-dir": {
			type: "string",
			description: "TODO:",
			parse: (value) => {
				let stats: Stats;
				try {
					stats = lstatSync(value);
				} catch {
					throw new Error("Path does not exist");
				}
				if (!stats.isDirectory()) {
					throw new Error("Not a directory");
				}
				return value;
			},
		},
		"font-family": {
			type: "string",
			description: "TODO:",
		},
		weights: {
			type: "custom",
			description: "TODO:",
			parse: (value) => {
				const rawWeights = value.trim().split(",");

				const valid = new Set<string>();
				const invalid = new Set<string>();
				for (const rawWeight of rawWeights) {
					if (rawWeight.includes(" ")) {
						const parts = rawWeight.split(" ");
						if (parts.length !== 2) {
							invalid.add(rawWeight);
							continue;
						}

						const min = Number.parseInt(parts[0], 10);
						const max = Number.parseInt(parts[0], 10);

						if (Number.isNaN(min) || Number.isNaN(max)) {
							invalid.add(rawWeight);
						} else {
							valid.add(rawWeight);
						}

						continue;
					}

					const parsed = Number.parseInt(rawWeight, 10);
					if (Number.isNaN(parsed)) {
						invalid.add(rawWeight);
					} else {
						valid.add(rawWeight);
					}
				}

				if (invalid.size > 0) {
					throw new Error(`Invalid values: ${[...invalid].join(", ")}`);
				}

				return valid.size > 0 ? [...valid] : undefined;
			},
		},
		styles: {
			type: "custom",
			description: "TODO:",
			parse: (value) => {
				const styles = value.trim().split(",");

				const valid = new Set<FontStyles>();
				const invalid = new Set<string>();
				for (const style of styles) {
					if (isFontStyle(style)) {
						valid.add(style);
					} else {
						invalid.add(style);
					}
				}

				if (invalid.size > 0) {
					throw new Error(`Invalid values: ${[...invalid].join(", ")}`);
				}

				return valid.size > 0 ? [...valid] : undefined;
			},
		},
		formats: {
			type: "custom",
			description: "TODO:",
			parse: (value) => {
				const formats = value.trim().split(",");

				const valid = new Set<FontFormat>();
				const invalid = new Set<string>();
				for (const format of formats) {
					if (isFontFormat(format)) {
						valid.add(format);
					} else {
						invalid.add(format);
					}
				}

				if (invalid.size > 0) {
					throw new Error(`Invalid values: ${[...invalid].join(", ")}`);
				}

				return valid.size > 0 ? [...valid] : undefined;
			},
		},
		subsets: {
			type: "custom",
			description: "TODO:",
			parse: (value) => {
				const subsets = value.trim().split(",");

				return subsets;
			},
		},
		"css-variable": {
			type: "string",
			description: "TODO:",
			parse: (value) => {
				const message = (() => {
					if (!value.startsWith("--")) return "Must start with --";
					if (value.length < 3)
						return "Must at least contain another character";
					if (!/^--[A-Za-z0-9_-]+$/.test(value))
						return "Must be valid CSS ident. It can only contain letters, digits, hyphens and underscores";
				})();
				if (message) {
					throw new Error(message);
				}
				return value;
			},
		},
	},
	examples: "TODO:",
	async run(ctx) {
		return await import("./commands/main.js").then((mod) =>
			mod.mainImpl({
				isAgent: agent,
				pkg,
				args: {
					publicDir: ctx.values["public-dir"],
					publicFontsDir: ctx.values["public-fonts-dir"],
					stylesDir: ctx.values["styles-dir"],
					fontFamily: ctx.values["font-family"],
					weights: ctx.values.weights,
					styles: ctx.values.styles,
					formats: ctx.values.formats,
					subsets: ctx.values.subsets,
					cssVariable: ctx.values["css-variable"],
				},
			}),
		);
	},
});

await cli(process.argv.slice(2), main, {
	name: pkg.name,
	description: pkg.description,
	version: pkg.version,
	renderHeader: null,
});
