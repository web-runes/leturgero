import { selectFamily } from "../core/select-family.js";
import { ClackAutocomplete } from "../infra/clack-autocomplete.js";
import { ClackLogger } from "../infra/clack-logger.js";
import { ClackSpinner } from "../infra/clack-spinner.js";
import { FuseSearch } from "../infra/fuse-search.js";
import { UnifontFontsManager } from "../infra/unifont-fonts-manager.js";

const MAX = 10;

export async function searchImpl(input: string | undefined): Promise<void> {
	const createSpinner = () => new ClackSpinner();
	const createAutocomplete = () => new ClackAutocomplete();

	const initSpinner = createSpinner();
	initSpinner.start("Initializing...");
	const fontsManager = await UnifontFontsManager.create();
	initSpinner.stop("Initialized");

	const search = new FuseSearch(await fontsManager.list(), ["name"]);

	if (input) {
		const logger = new ClackLogger();
		// TODO: it somehow matches better than selectFamily(), figure out why
		const items = search.search(input).slice(0, MAX);

		if (items.length <= 0) {
			logger.warn("No families found");
			return;
		}

		logger.step(
			`Available families (top ${MAX} matches): ${items.map((e) => e.name).join(", ")}`,
		);
		return;
	}

	await selectFamily({
		autocomplete: createAutocomplete(),
		search,
	});
}
