import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import { styleText } from "node:util";
import { intro, note, outro, stream } from "@clack/prompts";
import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };
import { generateCss } from "./core/generate-css.js";
import { proxySources } from "./core/proxy-sources.js";
import { saveCssToDisk } from "./core/save-css-to-disk.js";
import { saveFontsToDisk } from "./core/save-fonts-to-disk.js";
import { selectCssVariable } from "./core/select-css-variable.js";
import { selectFamily } from "./core/select-family.js";
import { selectPaths } from "./core/select-paths.js";
import { selectProperties } from "./core/select-properties.js";
import { ClackAutocomplete } from "./infra/clack-autocomplete.js";
import { ClackDirectoryPicker } from "./infra/clack-directory-picker.js";
import {
	ClackCancelError,
	ClackErrorHandler,
} from "./infra/clack-error-handler.js";
import { ClackLogger } from "./infra/clack-logger.js";
import { ClackMultiselect } from "./infra/clack-multiselect.js";
import { ClackProgress } from "./infra/clack-progress.js";
import { ClackSpinner } from "./infra/clack-spinner.js";
import { ClackText } from "./infra/clack-text.js";
import { CryptoHasher } from "./infra/crypto-hasher.js";
import { FuseSearch } from "./infra/fuse-search.js";
import { UnifontFontsManager } from "./infra/unifont-fonts-manager.js";

const main = defineCommand({
	meta: {
		name: pkg.name,
		description: pkg.description,
		version: pkg.version,
	},
	// TODO: implement flags
	args: {},
	// TODO: detect agent usage and abort with some kind of help
	// may need splitting some features in several commands
	async run() {
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

			intro(
				`Welcome to ${styleText("bgGreen", ` ${pkg.name} `)} ${styleText("green", `v${pkg.version}`)}!`,
			);

			await stream.message(
				createReadStream(new URL("../logo.txt", import.meta.url), {
					encoding: "utf-8",
				}),
			);

			const initSpinner = createSpinner();
			initSpinner.start("Initializing...");
			const fontsManager = await UnifontFontsManager.create();
			initSpinner.stop("Initialized");

			const root = process.cwd();

			const paths = await selectPaths({
				directoryPicker: createDirectoryPicker(),
				root,
			});

			const family = await selectFamily({
				fontsManager,
				autocomplete: createAutocomplete(),
				createSearch: (items) => new FuseSearch(items, ["name"]),
			});

			const suggestions = await fontsManager.getSuggestions(family);

			const properties = await selectProperties({
				suggestions,
				createMultiselect,
				logger,
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
			});

			const total = fonts.reduce((acc, font) => {
				return acc + font.src.filter((src) => !("name" in src)).length;
			}, 0);

			// TODO: ask for confirmation with the amount of files that will be downloaded

			const proxyResult = await proxySources({
				cssVariable,
				fonts,
				fontsDir: paths.fonts,
				hasher,
				root,
				createProgress: () => createProgress(total),
				createCancelError: () => new ClackCancelError(),
				fetch: (url) =>
					fetch(url)
						.then((res) => res.arrayBuffer())
						.then((e) => Buffer.from(e)),
			});

			fonts = proxyResult.fonts;

			await saveFontsToDisk({
				filenameToContents: proxyResult.filenameToContents,
				fontsDir: paths.fonts,
				writeFile,
				logger,
			});

			// TODO: ask for fallbacks (use resolved.fallbacks)

			// TODO: optimized fallbacks

			const css = generateCss({
				cssVariable,
				// TODO: update
				fallbacks: resolved.fallbacks ?? [],
				family: family.name,
				fonts,
			});

			await saveCssToDisk({
				css,
				cssVariable,
				logger,
				stylesDir: paths.styles,
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
	},
});

runMain(main);
