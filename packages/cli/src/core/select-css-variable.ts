import type { Text } from "../types.js";
import { kebabize } from "../utils.js";

interface Options {
	family: string;
	text: Text;
}

export async function selectCssVariable(options: Options): Promise<string> {
	return await options.text.run({
		message: "Choose what name to use for the CSS variable",
		initialValue: `--${kebabize(options.family)}`,
		validate(value) {
			if (!value) return "Required";
			if (!value.startsWith("--")) return "Must start with --";
			if (value.length < 3) return "Must at least have one character"
			if (!/^--[A-Za-z0-9_-]+$/.test(value))
				return "Must only contain letters, digits, - and _";
		},
	});
}
