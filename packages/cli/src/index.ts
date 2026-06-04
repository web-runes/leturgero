import { updateSettings } from "@clack/prompts";
import { cli, define } from "gunshi";
import { getAgentProfile } from "gunshi/agent";
import pkg from "../package.json" with { type: "json" };
import { normalizeGunshiArgs, toGunshiArgs } from "./core/args.js";
import { args as selectCssVariableArgs } from "./core/select-css-variable.js";
import { args as selectFamilyArgs } from "./core/select-family.js";
import { args as selectPathsArgs } from "./core/select-paths.js";
import { args as selectPropertiesArgs } from "./core/select-properties.js";

// TODO: properly abstract commands
// TODO: test flow as human
// TODO: test flow as agent
// TODO: review all texts again

const { isAgent } = getAgentProfile();

if (isAgent) {
	updateSettings({ withGuide: false });
}

const main = define({
	args: toGunshiArgs({
		...selectPathsArgs,
		...selectFamilyArgs,
		...selectPropertiesArgs,
		...selectCssVariableArgs,
	}),
	examples: "TODO:",
	async run(ctx) {
		return await import("./commands/main.js").then((mod) =>
			mod.mainImpl({
				isAgent,
				pkg,
				args: normalizeGunshiArgs(
					{
						...selectPathsArgs,
						...selectFamilyArgs,
						...selectPropertiesArgs,
						...selectCssVariableArgs,
					},
					ctx.values,
				),
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
