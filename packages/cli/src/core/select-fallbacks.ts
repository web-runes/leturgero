import type { Logger, Text } from "../types.js";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	type InferArgs,
} from "./args.js";

/** Split a comma-separated list into trimmed, non-empty font family names. */
export function parseFallbacks(value: string): Array<string> {
	return value
		.split(",")
		.map((v) => v.trim())
		.filter((v) => v.length > 0);
}

export const args = {
	fallbacks: {
		cliName: "fallbacks",
		type: "custom",
		description:
			"Fallback font families to append to the CSS variable, comma-separated. Defaults to the family's resolved fallbacks",
		parse: parseFallbacks,
	},
} as const satisfies ArgsConstraint;

interface Options {
	defaultFallbacks: Array<string>;
	text: Text;
	isAgent: boolean;
	args: InferArgs<typeof args>;
	logger: Logger;
}

export async function selectFallbacks(
	options: Options,
): Promise<Array<string>> {
	if (options.args.fallbacks) {
		return options.args.fallbacks;
	}

	// Fallbacks are optional and come with sensible defaults, so an agent can
	// keep going without an explicit flag.
	if (options.isAgent) {
		options.logger.warn(argsToHelpMessage(args, { optional: ["fallbacks"] }));
		options.logger.step(`Fallbacks: ${options.defaultFallbacks.join(", ")}`);
		return options.defaultFallbacks;
	}

	const value = await options.text.run({
		message: "What fallback fonts would you like to use? (comma-separated)",
		initialValue: options.defaultFallbacks.join(", "),
	});

	return parseFallbacks(value);
}
