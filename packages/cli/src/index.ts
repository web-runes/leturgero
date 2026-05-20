import { intro, outro } from "@clack/prompts";
import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };
import { selectFamily } from "./core/select-family.js";
import { ClackAutocomplete } from "./infra/clack-autocomplete.js";
import { ClackErrorHandler } from "./infra/clack-error-handler.js";
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
			const fontsManager = new UnifontFontsManager({
				spinner: createSpinner(),
			});

			intro("Welcome!");

			await fontsManager.init();

			const { family, provider } = await selectFamily({
				fontsManager,
				autocomplete: createAutocomplete(),
				createSearch: (items) => new FuseSearch(items, ["family"]),
			});
			// TODO: remove
			console.log({ family, provider });

			// TODO: retrieve suggestions
			// TODO: if there are suggestions, ask for:
			// TODO: weights
			// TODO: styles
			// TODO: subsets
			// TODO: formats

			// TODO: ask for fallbacks

			outro("Thank you!");
		} catch (error) {
			errorHandler.onError(error);
		}
	},
});

runMain(main);
