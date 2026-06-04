import type { Autocomplete, Logger, MinimalFamily, Search } from "../types.js";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	type InferArgs,
} from "./args.js";
import { ShortCircuit } from "./short-circuit.js";

const MAX = 10;

export const args = {
	fontFamily: {
		cliName: "font-family",
		type: "string",
		description: `The font family to use. If the exact provided value cannot be found, ${MAX} potential matches will be returned`,
	},
} as const satisfies ArgsConstraint;

interface Options {
	autocomplete: Autocomplete;
	search: Search<MinimalFamily>;
	isAgent: boolean;
	args: InferArgs<typeof args>;
	logger: Logger;
}

export async function selectFamily(options: Options): Promise<MinimalFamily> {
	if (options.isAgent && !options.args.fontFamily) {
		options.logger.warn(argsToHelpMessage(args));
		throw new ShortCircuit({ type: "silent" });
	}

	if (options.args.fontFamily) {
		const exact = options.search.items.find(
			(e) => e.name.toLowerCase() === options.args.fontFamily?.toLowerCase(),
		);
		if (exact) return exact;

		const items = options.search.search(options.args.fontFamily).slice(0, MAX);
		options.logger.warn(
			`No exact match found for --${args.fontFamily.cliName}. Retry with a valid family`,
		);
		options.logger.step(
			`Available families (top ${MAX} matches): ${items.map((e) => e.name).join(", ")}`,
		);
		throw new ShortCircuit({ type: "silent" });
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
