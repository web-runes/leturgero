import type { Autocomplete, FontsManager, Search } from "../types.js";

interface Options {
	fontsManager: FontsManager;
	autocomplete: Autocomplete;
	createSearch: (
		input: Array<{ family: string; provider: string }>,
	) => Search<{ family: string; provider: string }>;
}

export async function selectFamily(
	options: Options,
): Promise<{ family: string; provider: string }> {
	const families = await options.fontsManager.list();
	const search = options.createSearch(families);
	return await options.autocomplete.run({
		message: `Search for a family (${families.length} available):`,
		onSearch(input) {
			return search.search(input).map((value) => ({
				value,
				label: value.family,
			}));
		},
	});
}
