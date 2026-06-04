import type { Autocomplete, Logger, MinimalFamily, Search } from "../types.js";

interface Options {
	autocomplete: Autocomplete;
	search: Search<MinimalFamily>;
	isAgent: boolean;
	args: {
		fontFamily: string | undefined;
	};
	logger: Logger;
}

const MAX = 10;

// TODO: figure out another pattern than process.exit

export async function selectFamily(options: Options): Promise<MinimalFamily> {
	if (options.isAgent && !options.args.fontFamily) {
		options.logger.warn(
			"Following flags must be set: --font-family. Run the command again with --help to know the prerequisites for each.",
		);
		process.exit(0);
	}

	if (options.args.fontFamily) {
		const exact = options.search
			.search(options.args.fontFamily, {
				exact: true,
			})
			.at(0);
		if (exact) {
			return exact;
		}
		const items = options.search.search(options.args.fontFamily).slice(0, MAX);
		options.logger.warn(
			"No exact match found for --font-family. Retry with a valid family",
		);
		options.logger.step(
			`Available families (top ${MAX} matches): ${items.map((e) => e.name).join(", ")}`,
		);
		process.exit(0);
	}

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
