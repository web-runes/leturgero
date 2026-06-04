import { createReadStream } from "node:fs";
import { styleText } from "node:util";
import { intro, note, outro, stream, updateSettings } from "@clack/prompts";
import { cli, define } from "gunshi";
import { getAgentProfile } from "gunshi/agent";
import pkg from "../package.json" with { type: "json" };
import { normalizeGunshiArgs, toGunshiArgs } from "./core/args.js";
import { args as selectCssVariableArgs } from "./core/select-css-variable.js";
import { args as selectFamilyArgs } from "./core/select-family.js";
import { args as selectPathsArgs } from "./core/select-paths.js";
import { args as selectPropertiesArgs } from "./core/select-properties.js";

// TODO: test flow as human
// TODO: test flow as agent
// TODO: review all texts again
// TODO: tests

const { isAgent } = getAgentProfile();

// TODO: not needed if there's a json logger for agents
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
		const [
			{ mainImpl },
			{ ClackAutocomplete },
			{ ClackDirectoryPicker },
			{ ClackErrorHandler },
			{ ClackLogger },
			{ ClackMultiselect },
			{ ClackProgress },
			{ ClackSpinner },
			{ ClackText },
			{ CryptoHasher },
			{ FuseSearch },
			{ UnifontFontsManager },
			{ ClackConfirm },
			{ NodeFilesystem },
		] = await Promise.all([
			import("./commands/main.js"),
			import("./infra/clack-autocomplete.js"),
			import("./infra/clack-directory-picker.js"),
			import("./infra/clack-error-handler.js"),
			import("./infra/clack-logger.js"),
			import("./infra/clack-multiselect.js"),
			import("./infra/clack-progress.js"),
			import("./infra/clack-spinner.js"),
			import("./infra/clack-text.js"),
			import("./infra/crypto-hasher.js"),
			import("./infra/fuse-search.js"),
			import("./infra/unifont-fonts-manager.js"),
			import("./infra/clack-confirm.js"),
			import("./infra/node-filesystem.js"),
		]);

		const outroMessage = `Thanks for using our tool! We'd love your feedback: ${styleText("blue", "https://github.com/web-runes/leturgero/issues")}`;

		return await mainImpl({
			isAgent,
			args: normalizeGunshiArgs(
				{
					...selectPathsArgs,
					...selectFamilyArgs,
					...selectPropertiesArgs,
					...selectCssVariableArgs,
				},
				ctx.values,
			),
			errorHandler: new ClackErrorHandler({ outroMessage }),
			createSpinner: () => new ClackSpinner(),
			createAutocomplete: () => new ClackAutocomplete(),
			createMultiselect: () => new ClackMultiselect(),
			createDirectoryPicker: () => new ClackDirectoryPicker(),
			createProgress: (max) => new ClackProgress({ max }),
			createText: () => new ClackText(),
			logger: new ClackLogger(),
			hasher: new CryptoHasher(),
			createFontsManager: () => UnifontFontsManager.create(),
			createSearch: (items, keys) => new FuseSearch(items, keys),
			createConfirm: () => new ClackConfirm({ force: isAgent }),
			filesystem: new NodeFilesystem(),
			intro: async () => {
				if (isAgent) return;
				intro(
					`Welcome to ${styleText("bgGreen", ` ${pkg.name} `)} ${styleText("green", `v${pkg.version}`)}!`,
				);
				await stream.message(
					createReadStream(new URL("../logo.txt", import.meta.url), {
						encoding: "utf-8",
					}),
				);
			},
			outro: () => {
				note(
					[
						"Now that you have font and CSS files, it is time to hook them up in your project.",
						`Head over to the documentation to learn how: ${styleText("blue", "TODO:")}`,
					].join("\n"),
					"Next steps",
				);

				outro(outroMessage);
			},
		});
	},
});

await cli(process.argv.slice(2), main, {
	name: pkg.name,
	description: pkg.description,
	version: pkg.version,
	renderHeader: null,
});
