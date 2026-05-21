import { intro, outro } from "@clack/prompts";
import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };
import { download } from "./core/download.js";
import { extractSources } from "./core/extract-sources.js";
import { selectFamily } from "./core/select-family.js";
import { selectPaths } from "./core/select-paths.js";
import { selectProperties } from "./core/select-properties.js";
import { ClackAutocomplete } from "./infra/clack-autocomplete.js";
import { ClackDirectoryPicker } from "./infra/clack-directory-picker.js";
import { ClackErrorHandler } from "./infra/clack-error-handler.js";
import { ClackLogger } from "./infra/clack-logger.js";
import { ClackMultiselect } from "./infra/clack-multiselect.js";
import { ClackSpinner } from "./infra/clack-spinner.js";
import { FuseSearch } from "./infra/fuse-search.js";
import { UnifontFontsManager } from "./infra/unifont-fonts-manager.js";

const main = defineCommand({
	meta: {
		name: pkg.name,
		description: pkg.description,
		version: pkg.version,
	},
	args: {},
	async run() {
		const errorHandler = new ClackErrorHandler();
		try {
			const createSpinner = () => new ClackSpinner();
			const createAutocomplete = () => new ClackAutocomplete();
			const createMultiselect = () => new ClackMultiselect();
			const createDirectoryPicker = () => new ClackDirectoryPicker();
			const logger = new ClackLogger();

			intro("Welcome!");

			const initSpinner = createSpinner();
			initSpinner.start("Initializing...");
			const fontsManager = await UnifontFontsManager.create();
			initSpinner.stop("Initialized");

			const paths = await selectPaths({
				directoryPicker: createDirectoryPicker(),
				root: process.cwd(),
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

			// TODO: figure out what to do exactly. Needs:
			// - download sources
			// - generate filename from data + contents hash + format
			// - copy to disk
			// - proxy in data
			// - emit css

			const sources = extractSources(resolved.fonts);

			await download({
				fontsPath: paths.fonts,
				sources,
			});

			// TODO: ask for fallbacks (may need changes upstream to retrieve the category)

			outro("Thank you!");
		} catch (error) {
			errorHandler.onError(error);
		}
	},
});

runMain(main);
