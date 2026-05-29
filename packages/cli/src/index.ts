import { note } from "@clack/prompts";
import { isAgent } from "am-i-vibing";
import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };

const main = defineCommand({
	meta: {
		name: pkg.name,
		description: pkg.description,
		version: pkg.version,
	},
	async run() {
		if (isAgent()) {
			note(
				[
					"The main command is for human usage because it is interactive. Here is what to do:",
					`1. Run ${pkg.name} search <family>, for example: ${pkg.name} search Inter. It will output the list of available font families`,
					`2. Run ${pkg.name} details <family>, for example: ${pkg.name} details Inter. It will list all available properties: weights, styles, subsets and formats`,
					`3. Run ${pkg.name} save --help to check all available parameters. Some should be provided from step 2`,
					`4. Run ${pkg.name} save <family> [...args]`,
				].join("\n"),
				"Agent instructions",
				{ withGuide: false },
			);
			return;
		}
		return await import("./commands/main.js").then((mod) => mod.mainImpl());
	},
});

runMain(main);
