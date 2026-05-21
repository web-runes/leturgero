import { intro, outro } from "@clack/prompts";
import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };
import { selectFamily } from "./core/select-family.js";
import { selectProperties } from "./core/select-properties.js";
import { ClackAutocomplete } from "./infra/clack-autocomplete.js";
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
			const logger = new ClackLogger();

			intro("Welcome!");

			const initSpinner = createSpinner();
			initSpinner.start("Initializing...");
			const fontsManager = await UnifontFontsManager.create();
			initSpinner.stop("Initialized");

			const minimalFamily = await selectFamily({
				fontsManager,
				autocomplete: createAutocomplete(),
				createSearch: (items) => new FuseSearch(items, ["name"]),
			});

			const suggestions = await fontsManager.getSuggestions(minimalFamily);

			const properties = await selectProperties({
				suggestions,
				createMultiselect,
				logger,
			});

			console.log(properties);

			// TODO: resolve / download

			// TODO: ask for fallbacks (may need changes upstream to retrieve the category)

			// TODO: fonts dir
			// TODO: css dir

			outro("Thank you!");
		} catch (error) {
			errorHandler.onError(error);
		}
	},
});

runMain(main);
