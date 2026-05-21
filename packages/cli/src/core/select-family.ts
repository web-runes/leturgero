import type {
	Autocomplete,
	FontsManager,
	MinimalFamily,
	Search,
} from "../types.js";

interface Options {
	fontsManager: FontsManager;
	autocomplete: Autocomplete;
	createSearch: (input: Array<MinimalFamily>) => Search<MinimalFamily>;
}

export async function selectFamily(options: Options): Promise<MinimalFamily> {
	const families = await options.fontsManager.list();
	const search = options.createSearch(families);
	return await options.autocomplete.run({
		message: `Search for a family (${families.length} available):`,
		onSearch(input) {
			return search.search(input).map((value) => ({
				value,
				label: value.name,
			}));
		},
	});
}
