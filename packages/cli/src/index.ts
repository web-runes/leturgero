#!/usr/bin/env node
import { createReadStream } from "node:fs";
import { intro, note, outro, stream } from "@clack/prompts";
import { isAgent as detectAgent } from "am-i-vibing";
import pkg from "../package.json" with { type: "json" };
import { CliArgsError, parseCliArgs } from "./core/args.js";
import { renderHelp } from "./core/help.js";
import { args as selectCssVariableArgs } from "./core/select-css-variable.js";
import { args as selectFallbacksArgs } from "./core/select-fallbacks.js";
import { args as selectFamilyArgs } from "./core/select-family.js";
import { args as selectOptimizeFallbacksArgs } from "./core/select-optimize-fallbacks.js";
import { args as selectPathsArgs } from "./core/select-paths.js";
import { args as selectPropertiesArgs } from "./core/select-properties.js";

const ARGS = {
	...selectPathsArgs,
	...selectFamilyArgs,
	...selectPropertiesArgs,
	...selectCssVariableArgs,
	...selectFallbacksArgs,
	...selectOptimizeFallbacksArgs,
};

const EXAMPLES: Record<string, string> = {
	"As an agent, start with no flags and let yourself be guided": `npx ${pkg.name}`,
	"Using npm": `npx ${pkg.name}`,
	"Using pnpm": `pnpx ${pkg.name}`,
	"Using yarn": `yarn dlx ${pkg.name}`,
	"With a few flags": `${pkg.name} --${selectPathsArgs.publicDir.cliName} "Inter Tight" --${selectPropertiesArgs.weights.cliName} "400,500"`,
	"With all flags": [
		pkg.name,
		`--${selectPathsArgs.publicDir.cliName} /foo/bar/public/`,
		`--${selectPathsArgs.publicFontsDir.cliName} fonts`,
		`--${selectPathsArgs.stylesDir.cliName} /foo/bar/src/styles/`,
		`--${selectFamilyArgs.fontFamily.cliName} "Inter"`,
		`--${selectPropertiesArgs.weights.cliName} "300,400"`,
		`--${selectPropertiesArgs.styles.cliName} "normal,italic"`,
		`--${selectPropertiesArgs.formats.cliName} "woff2,woff"`,
		`--${selectPropertiesArgs.subsets.cliName} latin`,
		`--${selectCssVariableArgs.cssVariable.cliName} "--font-inter"`,
		`--${selectFallbacksArgs.fallbacks.cliName} "Arial,sans-serif"`,
		`--${selectOptimizeFallbacksArgs.optimizeFallbacks.cliName} yes`,
	].join(" "),
};

const isAgent = detectAgent();

let parsed: ReturnType<typeof parseCliArgs<typeof ARGS>>;
try {
	parsed = parseCliArgs(ARGS, process.argv.slice(2));
} catch (error) {
	if (!(error instanceof CliArgsError)) throw error;
	console.error(`${error.message}\nRun with --help to list the known flags`);
	process.exit(1);
}

if (parsed.help) {
	console.log(renderHelp({ name: pkg.name, args: ARGS, examples: EXAMPLES }));
	process.exit(0);
}

if (parsed.version) {
	console.log(pkg.version);
	process.exit(0);
}

const [
	{ mainImpl },
	{ ClackAutocomplete },
	{ ClackDirectoryPicker },
	{ ClackErrorHandler },
	{ ClackLogger },
	{ ClackMultiselect },
	{ ClackProgress },
	{ ClackSelect },
	{ ClackSpinner },
	{ ClackText },
	{ CryptoHasher },
	{ FuseSearch },
	{ UnifontFontsManager },
	{ ClackConfirm },
	{ NodeFilesystem },
	{ NodeFetcher },
	{ NodeTextStyler },
	{ RealSystemFallbacksProvider },
	{ CapsizeFontMetricsResolver },
] = await Promise.all([
	import("./commands/main.js"),
	import("./infra/clack-autocomplete.js"),
	import("./infra/clack-directory-picker.js"),
	import("./infra/clack-error-handler.js"),
	import("./infra/clack-logger.js"),
	import("./infra/clack-multiselect.js"),
	import("./infra/clack-progress.js"),
	import("./infra/clack-select.js"),
	import("./infra/clack-spinner.js"),
	import("./infra/clack-text.js"),
	import("./infra/crypto-hasher.js"),
	import("./infra/fuse-search.js"),
	import("./infra/unifont-fonts-manager.js"),
	import("./infra/clack-confirm.js"),
	import("./infra/node-filesystem.js"),
	import("./infra/node-fetcher.js"),
	import("./infra/node-text-styler.js"),
	import("./infra/system-fallbacks-provider.js"),
	import("./infra/capsize-font-metrics-resolver.js"),
]);

const textStyler = new NodeTextStyler();

const outroMessage = `Thanks for using our tool! We'd love your feedback: ${textStyler.blue("https://github.com/web-runes/leturgero/issues")}`;

await mainImpl({
	isAgent,
	args: parsed.values,
	errorHandler: new ClackErrorHandler({ outroMessage }),
	createSpinner: () => new ClackSpinner(),
	createAutocomplete: () => new ClackAutocomplete(),
	createMultiselect: () => new ClackMultiselect(),
	createDirectoryPicker: () => new ClackDirectoryPicker(),
	createProgress: (max) => new ClackProgress({ max }),
	createText: () => new ClackText(),
	createSelect: () => new ClackSelect(),
	logger: new ClackLogger(),
	hasher: new CryptoHasher(),
	createFontsManager: () => UnifontFontsManager.create(),
	createSearch: (items, keys) => new FuseSearch(items, keys),
	createConfirm: () => new ClackConfirm({ force: isAgent }),
	filesystem: new NodeFilesystem(),
	fetcher: new NodeFetcher(),
	textStyler,
	systemFallbacksProvider: new RealSystemFallbacksProvider(),
	fontMetricsResolver: new CapsizeFontMetricsResolver(),
	intro: async () => {
		if (isAgent) return;
		intro(
			`Welcome to ${textStyler.bgGreen(` ${pkg.name} `)} ${textStyler.green(`v${pkg.version}`)}!`,
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
				`Head over to the documentation to learn how: ${textStyler.blue("https://leturgero.web-runes.dev/usage/")}`,
			].join("\n"),
			"Next steps",
		);

		outro(outroMessage);
	},
});
