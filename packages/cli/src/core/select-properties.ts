import type {
	FamilyProperties,
	FamilySuggestions,
	Logger,
	Multiselect,
} from "../types.js";

interface Options {
	suggestions: FamilySuggestions | undefined;
	createMultiselect: () => Multiselect;
	logger: Logger;
}

// TODO: update messages to tell suggestions are available

export async function selectProperties(
	options: Options,
): Promise<FamilyProperties> {
	const weights = await options.createMultiselect().run<string>({
		message: "Pick weights",
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

	const styles = await options.createMultiselect().run<string>({
		message: "Pick styles",
		options: (options.suggestions?.styles ?? ["normal", "italic"]).map(
			(value) => ({ value }),
		),
	});

	let subsets: FamilyProperties["subsets"];

	if (options.suggestions?.subsets) {
		subsets = await options.createMultiselect().run<string>({
			message: "Pick subsets",
			options: options.suggestions.subsets.map((value) => ({ value })),
		});
	} else {
		options.logger.step("Skipping subsets");
	}

	const formats = await options.createMultiselect().run<string>({
		message: "Pick formats",
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
