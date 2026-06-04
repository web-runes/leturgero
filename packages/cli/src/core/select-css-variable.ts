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
	if (!value.startsWith("--")) return "Must start with --";
	if (value.length < 3) return "Must at least contain another character";
	if (!/^--[A-Za-z0-9_-]+$/.test(value))
		return "Must be valid CSS ident. It can only contain letters, digits, hyphens and underscores";
}

export function validateSelectCssVariableArgs(values: Options["args"]) {
	const error = validate(values.cssVariable);
	if (error) throw new ShortCircuit({ type: "error", error });

	return values;
}

export async function selectCssVariable(options: Options): Promise<string> {
	if (options.isAgent && !options.args.cssVariable) {
		options.logger.warn(argsToHelpMessage(args));
		throw new ShortCircuit({ type: "silent" });
	}

	return (
		options.args.cssVariable ??
		(await options.text.run({
			message: "What name would you like to use for the CSS variable?",
			initialValue: `--font-${kebabize(options.family)}`,
			validate(value) {
				if (!value) return "Please enter a value";
				return validate(value);
			},
		}))
	);
}
