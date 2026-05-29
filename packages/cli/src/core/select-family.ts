import type { Autocomplete, MinimalFamily, Search } from "../types.js";

interface Options {
	autocomplete: Autocomplete;
	search: Search<MinimalFamily>;
}

export async function selectFamily(options: Options): Promise<MinimalFamily> {
	return await options.autocomplete.run({
		message: `What font family would you like to use? ${options.search.total} ${options.search.total === 1 ? "is" : "are"} available.`,
		onSearch(input) {
			return options.search.search(input).map((value) => ({
				value,
				label: value.name,
			}));
		},
	});
}
