import type { Text } from "../types.js";
import { kebabize } from "../utils.js";

interface Options {
	family: string;
	text: Text;
}

export async function selectCssVariable(options: Options): Promise<string> {
	return await options.text.run({
		message: "What name would you like to use for the CSS variable?",
		initialValue: `--font-${kebabize(options.family)}`,
		validate(value) {
			if (!value) return "Please enter a value";
			if (!value.startsWith("--")) return "Must start with --";
			if (value.length < 3) return "Must at least contain another character";
			if (!/^--[A-Za-z0-9_-]+$/.test(value))
				return "Must be valid CSS ident. It can only contain letters, digits, hyphens and underscores";
		},
	});
}
