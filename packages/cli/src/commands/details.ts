import { selectFamily } from "../core/select-family.js";
import { DEFAULT_PROPERTIES } from "../core/select-properties.js";
import { ClackAutocomplete } from "../infra/clack-autocomplete.js";
import { ClackLogger } from "../infra/clack-logger.js";
import { ClackSpinner } from "../infra/clack-spinner.js";
import { FuseSearch } from "../infra/fuse-search.js";
import { UnifontFontsManager } from "../infra/unifont-fonts-manager.js";

export async function detailsImpl(_family: string | undefined): Promise<void> {
	const createSpinner = () => new ClackSpinner();
	const createAutocomplete = () => new ClackAutocomplete();

	const initSpinner = createSpinner();
	initSpinner.start("Initializing...");
	const fontsManager = await UnifontFontsManager.create();
	initSpinner.stop("Initialized");

	const search = new FuseSearch(await fontsManager.list(), ["name"]);

	const family = _family
		? search.search(_family, { exact: true }).at(0)
		: await selectFamily({
				autocomplete: createAutocomplete(),
				search,
			});

	const logger = new ClackLogger();

	if (!family) {
		logger.warn("Family not found");
		return;
	}

	const suggestions = await fontsManager.getSuggestions(family);
	if (!suggestions) {
		logger.warn(
			"Suggestions could not be retrieved, some properties may not be available",
		);
	}
	logger.step(
		`Weights: ${(suggestions?.weights ?? DEFAULT_PROPERTIES.weights).join(", ")}`,
	);
	logger.step(
		`Styles: ${(suggestions?.styles ?? DEFAULT_PROPERTIES.styles).join(", ")}`,
	);
	if (suggestions?.subsets) {
		logger.step(`Subsets: ${(suggestions.subsets).join(", ")}`);
	} else {
		logger.step("Skipping subsets");
	}
	logger.step(
		`Formats: ${(suggestions?.formats ?? DEFAULT_PROPERTIES.formats).join(", ")}`,
	);
}
