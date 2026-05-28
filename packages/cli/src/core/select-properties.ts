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
}

function msg(word: string, suggestions: boolean): string {
	let message = `What ${word} would you like to use?`;
	if (!suggestions) message += `Some ${word} may not be available`;
	return message;
}

export async function selectProperties(
	options: Options,
): Promise<FamilyProperties> {
	const weights = await options.createMultiselect().run<string>({
		message: msg("weights", !!options.suggestions?.weights),
		options: (
			options.suggestions?.weights ?? [
				"100",
				"200",
				"300",
				"400",
				"500",
				"600",
				"700",
				"800",
				"900",
			]
		).map((value) => ({ value })),
	});

	const styles = await options.createMultiselect().run<FontStyles>({
		message: msg("styles", !!options.suggestions?.styles),
		options: (options.suggestions?.styles ?? ["normal", "italic"]).map(
			(value) => ({ value }),
		),
	});

	let subsets: FamilyProperties["subsets"];

	if (options.suggestions?.subsets) {
		subsets = await options.createMultiselect().run<string>({
			message: msg("subsets", true),
			options: options.suggestions.subsets.map((value) => ({ value })),
		});
	} else {
		options.logger.step(
			"No subsets are available for this font family, skipping",
		);
	}

	const formats = await options.createMultiselect().run<FontFormat>({
		message: msg("formats", !!options.suggestions?.formats),
		options: (options.suggestions?.formats ?? ["woff2", "woff"]).map(
			(value) => ({ value }),
		),
	});

	return {
		weights,
		styles,
		subsets,
		formats,
	};
}
