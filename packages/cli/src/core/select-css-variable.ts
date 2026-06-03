import type { Logger, Text } from "../types.js";
import { kebabize } from "../utils.js";

interface Options {
	family: string;
	text: Text;
	isAgent: boolean;
	args: {
		cssVariable: string | undefined;
	};
	logger: Logger;
}

export async function selectCssVariable(options: Options): Promise<string> {
	if (options.isAgent && !options.args.cssVariable) {
		options.logger.warn(
			"Following flags must be set: --css-variable. Run the command again with --help to know the prerequisites for each.",
		);
		process.exit(0);
	}

	return (
		options.args.cssVariable ??
		(await options.text.run({
			message: "What name would you like to use for the CSS variable?",
			initialValue: `--font-${kebabize(options.family)}`,
			validate(value) {
				if (!value) return "Please enter a value";
				if (!value.startsWith("--")) return "Must start with --";
				if (value.length < 3) return "Must at least contain another character";
				if (!/^--[A-Za-z0-9_-]+$/.test(value))
					return "Must be valid CSS ident. It can only contain letters, digits, hyphens and underscores";
			},
		}))
	);
}
