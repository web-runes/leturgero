import { writeFile } from "node:fs/promises";
import { intro, outro } from "@clack/prompts";
import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };
import { proxySources } from "./core/proxy-sources.js";
import { saveToDisk } from "./core/save-to-disk.js";
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
		const errorHandler = new ClackErrorHandler();
		try {
			const createSpinner = () => new ClackSpinner();
			const createAutocomplete = () => new ClackAutocomplete();
			const createMultiselect = () => new ClackMultiselect();
			const createDirectoryPicker = () => new ClackDirectoryPicker();
			const createProgress = (max: number) => new ClackProgress({ max });
			const createText = () => new ClackText();
			const logger = new ClackLogger();
			const hasher = new CryptoHasher();

			// TODO: improve
			intro("Welcome!");

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
			resolveSpinner.start("Resolving font data...");
			const resolved = await fontsManager.resolve(family, properties);
			resolveSpinner.stop("Resolved");

			let fonts = resolved.fonts;

			if (fonts.length === 0) {
				// TODO: improve explanation
				logger.warn("No fonts found, aborting");
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

			await saveToDisk({
				filenameToContents: proxyResult.filenameToContents,
				fontsDir: paths.fonts,
				writeFile,
			});

			logger.step(`Saved ${total} files to disk`);

			// TODO: ask for fallbacks (use resolved.fallbacks)

			// TODO: emit css

			// TODO: next steps (docs, call for feedback, thanks)
			outro("Thank you!");
		} catch (error) {
			errorHandler.onError(error);
		}
	},
});

runMain(main);
