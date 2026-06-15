#!/usr/bin/env node
import { createReadStream } from "node:fs";
import { styleText } from "node:util";
import { intro, note, outro, stream } from "@clack/prompts";
import { cli, define } from "gunshi";
import { getAgentProfile } from "gunshi/agent";
import pkg from "../package.json" with { type: "json" };
import { normalizeGunshiArgs, toGunshiArgs } from "./core/args.js";
import { args as selectCssVariableArgs } from "./core/select-css-variable.js";
import { args as selectFamilyArgs } from "./core/select-family.js";
import { args as selectPathsArgs } from "./core/select-paths.js";
import { args as selectPropertiesArgs } from "./core/select-properties.js";

const EXAMPLES: Record<string, string> = {
	"As an agent, start with no flags and let yourself be guided": `npx ${pkg.name}`,
	"Using npm": `npx ${pkg.name}`,
	"Using pnpm": `pnpx ${pkg.name}`,
	"Using yarn": `yarn dlx ${pkg.name}`,
	"With a few flags": `${pkg.name} --${selectPathsArgs.publicDir.cliName} "Inter Tight" --${selectPropertiesArgs.weights.cliName} "400,500"`,
	"With all flags": [
		pkg.name,
		`--${selectPathsArgs.publicDir.cliName} /foo/bar/public/`,
		`--${selectPathsArgs.publicFontsDir.cliName} ./fonts`,
		`--${selectPathsArgs.stylesDir.cliName} /foo/bar/src/styles/`,
		`--${selectFamilyArgs.fontFamily.cliName} "Inter"`,
		`--${selectPropertiesArgs.weights.cliName} "300,400"`,
		`--${selectPropertiesArgs.styles.cliName} "normal,italic"`,
		`--${selectPropertiesArgs.formats.cliName} "woff2,woff"`,
		`--${selectPropertiesArgs.subsets.cliName} latin`,
		`--${selectCssVariableArgs.cssVariable.cliName} "--font-inter"`,
	].join(" "),
};

const { isAgent } = getAgentProfile();

const main = define({
	args: toGunshiArgs({
		...selectPathsArgs,
		...selectFamilyArgs,
		...selectPropertiesArgs,
		...selectCssVariableArgs,
	}),
	examples: Object.entries(EXAMPLES)
		.map(([k, v]) => `# ${k}\n$ ${v}`)
		.join("\n\n"),
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
			{ NodeFetcher },
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
			import("./infra/node-fetcher.js"),
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
			fetcher: new NodeFetcher(),
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
						`Head over to the documentation to learn how: ${styleText("blue", "https://leturgero.web-runes.dev/usage/")}`,
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
