import { styleText } from "node:util";
import { intro, note, updateSettings } from "@clack/prompts";
import { isAgent } from "am-i-vibing";
import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };

function agentMessage(lines: Array<string>): void {
	note(lines.join("\n"), "Agent instructions");
}

const agent = isAgent();

const main = defineCommand({
	meta: {
		name: pkg.name,
		description: pkg.description,
		version: pkg.version,
	},
	setup() {
		if (agent) {
			updateSettings({ withGuide: false });
		}
		intro(
			`Welcome to ${styleText("bgGreen", ` ${pkg.name} `)} ${styleText("green", `v${pkg.version}`)}!`,
		);
	},
	async run() {
		if (agent) {
			agentMessage([
				"The main command is for human usage because it is interactive. Here is what to do:",
				`1. Run ${pkg.name} search <family>, for example: ${pkg.name} search Inter. It will output the list of available font families`,
				`2. Run ${pkg.name} details <family>, for example: ${pkg.name} details Inter. It will list all available properties: weights, styles, subsets and formats`,
				`3. Run ${pkg.name} save --help to check all available parameters. Some should be provided from step 2`,
				`4. Run ${pkg.name} save <family> [...args]`,
			]);
			return;
		}
		return await import("./commands/main.js").then((mod) => mod.mainImpl());
	},
	subCommands: {
		search: defineCommand({
			meta: {
				name: "search",
				description: "Search for available font families",
			},
			args: {
				family: {
					type: "positional",
					description:
						"The font family name to search for. If there's no exact match, potential matches will be returned",
					required: agent,
				},
			},
			async run(ctx) {
				return await import("./commands/search.js").then((mod) =>
					mod.searchImpl(ctx.args.family),
				);
			},
			cleanup() {
				process.exit(0);
			},
		}),
	},
});

runMain(main);
