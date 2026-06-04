import type { FontStyles } from "unifont";
import type {
	FamilyProperties,
	FamilySuggestions,
	FontFormat,
	Logger,
	Multiselect,
} from "../types.js";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	type InferArgs,
	parseArray,
} from "./args.js";
import { ShortCircuit } from "./short-circuit.js";

export const args = {
	weights: {
		cliName: "weights",
		type: "custom",
		description: "TODO:",
		parse: parseArray,
	},
	styles: {
		cliName: "styles",
		type: "custom",
		description: "TODO:",
		parse: parseArray,
	},
	formats: {
		cliName: "formats",
		type: "custom",
		description: "TODO:",
		parse: parseArray,
	},
	subsets: {
		cliName: "subsets",
		type: "custom",
		description: "TODO:",
		parse: parseArray,
	},
} as const satisfies ArgsConstraint;

interface Options {
	suggestions: FamilySuggestions | undefined;
	createMultiselect: () => Multiselect;
	logger: Logger;
	isAgent: boolean;
	args: InferArgs<typeof args>;
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

// TODO: validate

function validateWeights(
	rawWeights: Array<string> | undefined,
): Array<string> | undefined {
	if (!rawWeights) return;

	const valid = new Set<string>();
	const invalid = new Set<string>();
	for (const rawWeight of rawWeights) {
		if (rawWeight.includes(" ")) {
			const parts = rawWeight.split(" ");
			if (parts.length !== 2) {
				invalid.add(rawWeight);
				continue;
			}

			const min = Number.parseInt(parts[0], 10);
			const max = Number.parseInt(parts[0], 10);

			if (Number.isNaN(min) || Number.isNaN(max)) {
				invalid.add(rawWeight);
			} else {
				valid.add(rawWeight);
			}

			continue;
		}

		const parsed = Number.parseInt(rawWeight, 10);
		if (Number.isNaN(parsed)) {
			invalid.add(rawWeight);
		} else {
			valid.add(rawWeight);
		}
	}

	if (invalid.size > 0) {
		throw new Error(`Invalid values: ${[...invalid].join(", ")}`);
	}

	return valid.size > 0 ? [...valid] : undefined;
}

function isFontStyle(style: string): style is FontStyles {
	return (["normal", "italic", "oblique"] satisfies Array<FontStyles>).includes(
		style as any,
	);
}

function validateStyles(
	styles: Array<string> | undefined,
): Array<FontStyles> | undefined {
	if (!styles) return;

	const valid = new Set<FontStyles>();
	const invalid = new Set<string>();
	for (const style of styles) {
		if (isFontStyle(style)) {
			valid.add(style);
		} else {
			invalid.add(style);
		}
	}

	if (invalid.size > 0) {
		throw new Error(`Invalid values: ${[...invalid].join(", ")}`);
	}

	return valid.size > 0 ? [...valid] : undefined;
}

function isFontFormat(format: string): format is FontFormat {
	return (
		["eot", "otf", "ttf", "woff", "woff2"] satisfies Array<FontFormat>
	).includes(format as any);
}

// TODO: short circuit class maybe

function validateFormats(
	formats: Array<string> | undefined,
): Array<FontFormat> | undefined {
	if (!formats) return;

	const valid = new Set<FontFormat>();
	const invalid = new Set<string>();
	for (const format of formats) {
		if (isFontFormat(format)) {
			valid.add(format);
		} else {
			invalid.add(format);
		}
	}

	if (invalid.size > 0) {
		throw new Error(`Invalid values: ${[...invalid].join(", ")}`);
	}

	return valid.size > 0 ? [...valid] : undefined;
}

export async function selectProperties(
	options: Options,
): Promise<FamilyProperties> {
	if (
		options.isAgent &&
		(!options.args.weights || !options.args.styles || !options.args.formats)
	) {
		options.logger.warn(argsToHelpMessage(args, ["subsets"]));
		if (!options.suggestions) {
			options.logger.warn(
				"Suggestions could not be retrieved, some properties may not be available",
			);
		}
		options.logger.step(
			`Weights: ${(options.suggestions?.weights ?? DEFAULT_PROPERTIES.weights).join(", ")}`,
		);
		options.logger.step(
			`Styles: ${(options.suggestions?.styles ?? DEFAULT_PROPERTIES.styles).join(", ")}`,
		);
		if (options.suggestions?.subsets) {
			options.logger.step(
				`Subsets: ${(options.suggestions.subsets).join(", ")}`,
			);
		} else {
			options.logger.step("Skipping subsets");
		}
		options.logger.step(
			`Formats: ${(options.suggestions?.formats ?? DEFAULT_PROPERTIES.formats).join(", ")}`,
		);
		throw new ShortCircuit({ type: "silent" });
	}

	const weights =
		validateWeights(options.args.weights) ??
		(await options.createMultiselect().run<string>({
			message: msg("weights", !!options.suggestions?.weights),
			options: (options.suggestions?.weights ?? DEFAULT_PROPERTIES.weights).map(
				(value) => ({ value }),
			),
		}));

	const styles =
		validateStyles(options.args.styles) ??
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
		validateFormats(options.args.formats) ??
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
