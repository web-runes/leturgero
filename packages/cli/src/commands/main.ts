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
	selectFallbacks,
	type args as selectFallbacksArgs,
} from "../core/select-fallbacks.js";
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
import type {
	Autocomplete,
	Confirm,
	DirectoryPicker,
	ErrorHandler,
	Fetcher,
	Filesystem,
	FontsManager,
	Hasher,
	Logger,
	Multiselect,
	Progress,
	Search,
	Spinner,
	Text,
	TextStyler,
} from "../types.js";

interface Options {
	isAgent: boolean;
	args: InferArgs<typeof selectPathsArgs> &
		InferArgs<typeof selectFamilyArgs> &
		InferArgs<typeof selectPropertiesArgs> &
		InferArgs<typeof selectCssVariableArgs> &
		InferArgs<typeof selectFallbacksArgs>;
	errorHandler: ErrorHandler;
	createSpinner: () => Spinner;
	createAutocomplete: () => Autocomplete;
	createMultiselect: () => Multiselect;
	createDirectoryPicker: () => DirectoryPicker;
	createProgress: (max: number) => Progress;
	createText: () => Text;
	logger: Logger;
	hasher: Hasher;
	createFontsManager: () => Promise<FontsManager>;
	createSearch: <T extends Record<string, any>>(
		items: Array<T>,
		keys: Array<keyof T>,
	) => Search<T>;
	createConfirm: () => Confirm;
	intro: () => Promise<void>;
	outro: () => void;
	filesystem: Filesystem;
	fetcher: Fetcher;
	textStyler: TextStyler;
}

export async function mainImpl(options: Options): Promise<void> {
	try {
		await options.intro();

		const initSpinner = options.createSpinner();
		initSpinner.start("Initializing...");
		const fontsManager = await options.createFontsManager();
		initSpinner.stop("Initialized");

		const root = process.cwd();

		const paths = await selectPaths({
			directoryPicker: options.createDirectoryPicker(),
			root,
			text: options.createText(),
			isAgent: options.isAgent,
			args: await validateSelectPathsArgs(options.args, {
				filesystem: options.filesystem,
			}),
			logger: options.logger,
		});

		const family = await selectFamily({
			autocomplete: options.createAutocomplete(),
			search: options.createSearch(await fontsManager.list(), ["name"]),
			args: options.args,
			isAgent: options.isAgent,
			logger: options.logger,
			textStyler: options.textStyler,
		});

		const suggestions = await fontsManager.getSuggestions(family);

		const properties = await selectProperties({
			suggestions,
			createMultiselect: options.createMultiselect,
			logger: options.logger,
			isAgent: options.isAgent,
			args: validateSelectPropertiesArgs(options.args),
		});

		const resolveSpinner = options.createSpinner();
		resolveSpinner.start("Retrieving font data...");
		const resolved = await fontsManager.resolve(family, properties);
		resolveSpinner.stop("Retrieved");

		let fonts = resolved.fonts;

		if (fonts.length === 0) {
			options.logger.warn(
				"No fonts could be found for this combo of weights, styles, subsets and formats. Retry with another combination",
			);
			return;
		}

		const cssVariable = await selectCssVariable({
			family: family.name,
			text: options.createText(),
			logger: options.logger,
			isAgent: options.isAgent,
			args: validateSelectCssVariableArgs(options.args),
		});

		const total = fonts.reduce((acc, font) => {
			return acc + font.src.filter((src) => !("name" in src)).length;
		}, 0);

		if (
			!(await options
				.createConfirm()
				.run(
					`${total} file${total === 1 ? "" : "s"} will be downloaded. Do you want to continue?`,
				))
		) {
			throw new ShortCircuit({ type: "cancel" });
		}

		const proxyResult = await proxySources({
			cssVariable,
			fonts,
			publicDir: paths.publicDir,
			publicFontsDir: paths.publicFontsDir,
			hasher: options.hasher,
			createProgress: () => options.createProgress(total),
			fetcher: options.fetcher,
		});

		fonts = proxyResult.fonts;

		await saveFontsToDisk({
			filenameToContents: proxyResult.filenameToContents,
			publicDir: paths.publicDir,
			publicFontsDir: paths.publicFontsDir,
			filesystem: options.filesystem,
			logger: options.logger,
		});

		const fallbacks = await selectFallbacks({
			defaultFallbacks: resolved.fallbacks?.length
				? resolved.fallbacks
				: ["sans-serif"],
			text: options.createText(),
			isAgent: options.isAgent,
			args: options.args,
			logger: options.logger,
		});

		// TODO: ask if user wants optimized fallbacks (do not allow customization), default to true
		// for each file in proxyResult.filenameToContent, compute what's needed
		// add fonts to the array (need handling of adjust properties)

		const css = generateCss({
			cssVariable,
			fallbacks,
			family: family.name,
			fonts,
		});

		await saveCssToDisk({
			css,
			cssVariable,
			logger: options.logger,
			stylesDir: paths.stylesDir,
			filesystem: options.filesystem,
		});

		options.outro();
	} catch (error) {
		options.errorHandler.onError(error);
	}
}
