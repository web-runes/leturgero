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
		description: "Weights to download, comma-separated",
		parse: parseArray,
	},
	styles: {
		cliName: "styles",
		type: "custom",
		description: "Styles to download, comma-separated",
		parse: parseArray,
	},
	formats: {
		cliName: "formats",
		type: "custom",
		description: "Formats to download, comma-separated",
		parse: parseArray,
	},
	subsets: {
		cliName: "subsets",
		type: "custom",
		description:
			"Subsets to download, comma-separated. Not all fonts support subsets",
		parse: parseArray,
	},
} as const satisfies ArgsConstraint;

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

const DEFAULT_PROPERTIES = {
	weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	styles: ["normal", "italic"],
	formats: ["woff2", "woff"],
} as const;

function isFontStyle(style: string): style is FontStyles {
	return (["normal", "italic", "oblique"] satisfies Array<FontStyles>).includes(
		style as any,
	);
}

function isFontFormat(format: string): format is FontFormat {
	return (
		["eot", "otf", "ttf", "woff", "woff2"] satisfies Array<FontFormat>
	).includes(format as any);
}

function validateArray<T extends string>(
	name: string,
	elements: Array<string> | undefined,
	cb: (element: string) => { valid: T } | { invalid: string },
): { valid: Array<T> | undefined } | { invalid: string } {
	if (!elements) return { valid: undefined };

	const valid = new Set<T>();
	const invalid = new Set<string>();
	for (const element of elements) {
		const res = cb(element);
		if ("invalid" in res) {
			invalid.add(element);
		} else {
			valid.add(res.valid);
		}
	}

	if (invalid.size > 0) {
		throw new Error(`Invalid ${name}: ${[...invalid].join(", ")}`);
	}

	return { valid: valid.size > 0 ? [...valid] : undefined };
}

function shortCircuitInvalid<T extends string>(
	res: { valid: Array<T> | undefined } | { invalid: string },
): Array<T> | undefined {
	if ("invalid" in res) {
		throw new ShortCircuit({ type: "error", error: res.invalid });
	}
	return res.valid;
}

// TODO: should it be checked against suggestions?
export function validateSelectPropertiesArgs(
	values: InferArgs<typeof args>,
): Options["args"] {
	const weights = shortCircuitInvalid(
		validateArray<string>("weights", values.weights, (rawWeight) => {
			if (rawWeight.includes(" ")) {
				const parts = rawWeight.split(" ");
				if (parts.length !== 2) {
					return { invalid: rawWeight };
				}

				const min = Number.parseInt(parts[0], 10);
				const max = Number.parseInt(parts[0], 10);

				if (Number.isNaN(min) || Number.isNaN(max)) {
					return { invalid: rawWeight };
				} else {
					return { valid: rawWeight };
				}
			}

			const parsed = Number.parseInt(rawWeight, 10);
			if (Number.isNaN(parsed)) {
				return { invalid: rawWeight };
			} else {
				return { valid: rawWeight };
			}
		}),
	);

	const styles = shortCircuitInvalid(
		validateArray<FontStyles>("styles", values.styles, (style) => {
			if (isFontStyle(style)) {
				return { valid: style };
			} else {
				return { invalid: style };
			}
		}),
	);

	const formats = shortCircuitInvalid(
		validateArray<FontFormat>("formats", values.formats, (format) => {
			if (isFontFormat(format)) {
				return { valid: format };
			} else {
				return { invalid: format };
			}
		}),
	);

	return {
		weights,
		styles,
		formats,
		subsets: values.subsets,
	};
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
