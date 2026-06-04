import type { Logger, Text } from "../types.js";
import { kebabize } from "../utils.js";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	type InferArgs,
} from "./args.js";
import { ShortCircuit } from "./short-circuit.js";

export const args = {
	cssVariable: {
		cliName: "css-variable",
		type: "string",
		description: "TODO:",
	},
} as const satisfies ArgsConstraint;

interface Options {
	family: string;
	text: Text;
	isAgent: boolean;
	args: InferArgs<typeof args>;
	logger: Logger;
}

function validate(value: string | undefined): string | undefined {
	if (!value) return;
	if (!value.startsWith("--")) throw new Error("Must start with --");
	if (value.length < 3)
		throw new Error("Must at least contain another character");
	if (!/^--[A-Za-z0-9_-]+$/.test(value))
		throw new Error(
			"Must be valid CSS ident. It can only contain letters, digits, hyphens and underscores",
		);
	return value;
}

export async function selectCssVariable(options: Options): Promise<string> {
	if (options.isAgent && !options.args.cssVariable) {
		options.logger.warn(argsToHelpMessage(args));
		throw new ShortCircuit({ type: "silent" });
	}

	return (
		validate(options.args.cssVariable) ??
		(await options.text.run({
			message: "What name would you like to use for the CSS variable?",
			initialValue: `--font-${kebabize(options.family)}`,
			validate(value) {
				if (!value) return "Please enter a value";
				try {
					return validate(value);
				} catch (error) {
					return (error as Error).message;
				}
			},
		}))
	);
}
