import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import { styleText } from "node:util";
import { confirm, intro, note, outro, stream } from "@clack/prompts";
import type { InferArgs } from "../core/args.js";
import { generateCss } from "../core/generate-css.js";
import { proxySources } from "../core/proxy-sources.js";
import { saveCssToDisk } from "../core/save-css-to-disk.js";
import { saveFontsToDisk } from "../core/save-fonts-to-disk.js";
import {
	selectCssVariable,
	type args as selectCssVariableArgs,
	validateSelectCssVariableArgs,
} from "../core/select-css-variable.js";
import {
	selectFamily,
	type args as selectFamilyArgs,
} from "../core/select-family.js";
import {
	selectPaths,
	type args as selectPathsArgs,
	validateSelectPathsArgs,
} from "../core/select-paths.js";
import {
	selectProperties,
	type args as selectPropertiesArgs,
	validateSelectPropertiesArgs,
} from "../core/select-properties.js";
import { ShortCircuit } from "../core/short-circuit.js";
import { ClackAutocomplete } from "../infra/clack-autocomplete.js";
import { ClackDirectoryPicker } from "../infra/clack-directory-picker.js";
import { ClackErrorHandler } from "../infra/clack-error-handler.js";
import { ClackLogger } from "../infra/clack-logger.js";
import { ClackMultiselect } from "../infra/clack-multiselect.js";
import { ClackProgress } from "../infra/clack-progress.js";
import { ClackSpinner } from "../infra/clack-spinner.js";
import { ClackText } from "../infra/clack-text.js";
import { CryptoHasher } from "../infra/crypto-hasher.js";
import { FuseSearch } from "../infra/fuse-search.js";
import { UnifontFontsManager } from "../infra/unifont-fonts-manager.js";

interface Options {
	isAgent: boolean;
	pkg: {
		name: string;
		version: string;
	};
	args: InferArgs<typeof selectPathsArgs> &
		InferArgs<typeof selectFamilyArgs> &
		InferArgs<typeof selectPropertiesArgs> &
		InferArgs<typeof selectCssVariableArgs>;
}

// TODO: maybe different abstractions can be passed if it's an agent or not?
// TODO: json logger for agents?

export async function mainImpl(options: Options): Promise<void> {
	const outroMessage = `Thanks for using our tool! We'd love your feedback: ${styleText("blue", "https://github.com/web-runes/leturgero/issues")}`;
	const errorHandler = new ClackErrorHandler({ outroMessage });
	try {
		const createSpinner = () => new ClackSpinner();
		const createAutocomplete = () => new ClackAutocomplete();
		const createMultiselect = () => new ClackMultiselect();
		const createDirectoryPicker = () => new ClackDirectoryPicker();
		const createProgress = (max: number) => new ClackProgress({ max });
		const createText = () => new ClackText();
		const logger = new ClackLogger();
		const hasher = new CryptoHasher();

		if (!options.isAgent) {
			intro(
				`Welcome to ${styleText("bgGreen", ` ${options.pkg.name} `)} ${styleText("green", `v${options.pkg.version}`)}!`,
			);
			await stream.message(
				createReadStream(new URL("../../logo.txt", import.meta.url), {
					encoding: "utf-8",
				}),
			);
		}

		const initSpinner = createSpinner();
		initSpinner.start("Initializing...");
		const fontsManager = await UnifontFontsManager.create();
		initSpinner.stop("Initialized");

		const root = process.cwd();

		const paths = await selectPaths({
			directoryPicker: createDirectoryPicker(),
			root,
			text: createText(),
			isAgent: options.isAgent,
			args: await validateSelectPathsArgs(options.args),
			logger,
		});

		const family = await selectFamily({
			autocomplete: createAutocomplete(),
			search: new FuseSearch(await fontsManager.list(), ["name"]),
			args: options.args,
			isAgent: options.isAgent,
			logger,
		});

		const suggestions = await fontsManager.getSuggestions(family);

		const properties = await selectProperties({
			suggestions,
			createMultiselect,
			logger,
			isAgent: options.isAgent,
			args: validateSelectPropertiesArgs(options.args),
		});

		const resolveSpinner = createSpinner();
		resolveSpinner.start("Retrieving font data...");
		const resolved = await fontsManager.resolve(family, properties);
		resolveSpinner.stop("Retrieved");

		let fonts = resolved.fonts;

		if (fonts.length === 0) {
			logger.warn(
				"No fonts could be found for this combo of weights, styles, subsets and formats. Retry with another combination",
			);
			return;
		}

		const cssVariable = await selectCssVariable({
			family: family.name,
			text: createText(),
			logger,
			isAgent: options.isAgent,
			args: validateSelectCssVariableArgs(options.args),
		});

		const total = fonts.reduce((acc, font) => {
			return acc + font.src.filter((src) => !("name" in src)).length;
		}, 0);

		if (
			!options.isAgent &&
			(await confirm({
				message: `${total} file${total === 1 ? "" : "s"} will be downloaded. Do you want to continue?`,
			})) !== true
		) {
			throw new ShortCircuit({ type: "cancel" });
		}

		const proxyResult = await proxySources({
			cssVariable,
			fonts,
			publicDir: paths.publicDir,
			publicFontsDir: paths.publicFontsDir,
			hasher,
			createProgress: () => createProgress(total),
			fetch: (url) =>
				fetch(url)
					.then((res) => res.arrayBuffer())
					.then((e) => Buffer.from(e)),
		});

		fonts = proxyResult.fonts;

		await saveFontsToDisk({
			filenameToContents: proxyResult.filenameToContents,
			publicDir: paths.publicDir,
			publicFontsDir: paths.publicFontsDir,
			writeFile,
			logger,
		});

		// TODO: ask for fallbacks (use resolved.fallbacks)
		const fallbacks = resolved.fallbacks ?? [];

		// TODO: optimized fallbacks

		const css = generateCss({
			cssVariable,
			fallbacks,
			family: family.name,
			fonts,
		});

		await saveCssToDisk({
			css,
			cssVariable,
			logger,
			stylesDir: paths.stylesDir,
			writeFile,
		});

		note(
			[
				"Now that you have font and CSS files, it is time to hook them up in your project.",
				`Head over to the documentation to learn how: ${styleText("blue", "TODO:")}`,
			].join("\n"),
			"Next steps",
		);

		outro(outroMessage);
	} catch (error) {
		errorHandler.onError(error);
	}
}
