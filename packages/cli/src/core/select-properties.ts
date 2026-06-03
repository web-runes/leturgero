import type { FontStyles } from "unifont";
import type {
	FamilyProperties,
	FamilySuggestions,
	FontFormat,
	Logger,
	Multiselect,
} from "../types.js";

interface Options {
	suggestions: FamilySuggestions | undefined;
	createMultiselect: () => Multiselect;
	logger: Logger;
	isAgent: boolean;
	args: {
		weights: Array<string> | undefined;
		styles: Array<FontStyles> | undefined;
		formats: Array<FontFormat> | undefined;
		subsets: Array<string> | undefined;
	};
}

function msg(word: string, suggestions: boolean): string {
	let message = `What ${word} would you like to use?`;
	if (!suggestions) message += ` Some ${word} may not be available`;
	return message;
}

export const DEFAULT_PROPERTIES = {
	weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	styles: ["normal", "italic"],
	formats: ["woff2", "woff"],
} as const;

export async function selectProperties(
	options: Options,
): Promise<FamilyProperties> {
	if (
		options.isAgent &&
		(!options.args.weights || !options.args.styles || !options.args.formats)
	) {
		options.logger.warn(
			"Following flags must be set: --weights, --styles, --formats (--subsets is optional). Run the command again with --help to know the prerequisites for each.",
		);
		// TODO: show options
		process.exit(0);
	}

	// TODO: validate

	const weights =
		options.args.weights ??
		(await options.createMultiselect().run<string>({
			message: msg("weights", !!options.suggestions?.weights),
			options: (options.suggestions?.weights ?? DEFAULT_PROPERTIES.weights).map(
				(value) => ({ value }),
			),
		}));

	const styles =
		options.args.styles ??
		(await options.createMultiselect().run<FontStyles>({
			message: msg("styles", !!options.suggestions?.styles),
			options: (options.suggestions?.styles ?? DEFAULT_PROPERTIES.styles).map(
				(value) => ({ value }),
			),
		}));

	let subsets: FamilyProperties["subsets"];

	if (options.suggestions?.subsets) {
		subsets =
			options.args.subsets ??
			(await options.createMultiselect().run<string>({
				message: msg("subsets", true),
				options: options.suggestions.subsets.map((value) => ({ value })),
			}));
	} else {
		options.logger.step(
			"No subsets are available for this font family, skipping",
		);
	}

	const formats =
		options.args.formats ??
		(await options.createMultiselect().run<FontFormat>({
			message: msg("formats", !!options.suggestions?.formats),
			options: (options.suggestions?.formats ?? DEFAULT_PROPERTIES.formats).map(
				(value) => ({ value }),
			),
		}));

	return {
		weights,
		styles,
		subsets,
		formats,
	};
}
