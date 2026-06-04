// TODO: need to be a class
import { lstat } from "node:fs/promises";
import type { DirectoryPicker, Logger, Text } from "../types.js";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	type InferArgs,
} from "./args.js";
import { ShortCircuit } from "./short-circuit.js";

export const args = {
	publicDir: {
		cliName: "public-dir",
		type: "string",
		description: "TODO:",
	},
	publicFontsDir: {
		cliName: "public-fonts-dir",
		type: "string",
		description: "TODO:",
	},
	stylesDir: {
		cliName: "styles-dir",
		type: "string",
		description: "TODO:",
	},
} as const satisfies ArgsConstraint;

interface Options {
	directoryPicker: DirectoryPicker;
	text: Text;
	root: string;
	isAgent: boolean;
	args: InferArgs<typeof args>;
	logger: Logger;
}

async function validateDirectory(
	value: string | undefined,
): Promise<string | undefined> {
	if (!value) return;
	try {
		const stats = await lstat(value);
		if (!stats.isDirectory()) {
			return "Not a directory";
		}
	} catch {
		return "Path does not exist";
	}
}

function validateFontsDir(value: string | undefined): string | undefined {
	if (!value) return;
	if (value.match(/[^\x20-\x7E]/g) !== null)
		return "Invalid non-printable character present!";
}

export async function validateSelectPathsArgs(values: Options["args"]) {
	const publicDirError = await validateDirectory(values.publicDir);
	if (publicDirError)
		throw new ShortCircuit({ type: "error", error: publicDirError });
	const publicFontsDirError = validateFontsDir(values.publicDir);
	if (publicFontsDirError)
		throw new ShortCircuit({ type: "error", error: publicFontsDirError });
	const stylesDirError = await validateDirectory(values.stylesDir);
	if (stylesDirError)
		throw new ShortCircuit({ type: "error", error: stylesDirError });

	return values;
}

export async function selectPaths(options: Options): Promise<{
	publicDir: string;
	publicFontsDir: string;
	stylesDir: string;
}> {
	if (
		options.isAgent &&
		(!options.args.publicDir ||
			!options.args.publicFontsDir ||
			!options.args.stylesDir)
	) {
		options.logger.warn(argsToHelpMessage(args));
		throw new ShortCircuit({ type: "silent" });
	}

	const publicDir =
		options.args.publicDir ??
		(await options.directoryPicker.pick({
			message: "Where are your static assets saved? (e.g. public)",
			root: options.root,
		}));
	const publicFontsDir =
		options.args.publicFontsDir ??
		(await options.text.run({
			message:
				"Where would you like font files to be saved inside it? (e.g. fonts)",
			initialValue: "./fonts",
			validate(value) {
				if (!value) return "Please enter a value";
				return validateFontsDir(value);
			},
		}));
	const stylesDir =
		options.args.stylesDir ??
		(await options.directoryPicker.pick({
			message: "Where would you like CSS to be saved? (e.g. src/styles)",
			root: options.root,
		}));

	return { publicDir, publicFontsDir, stylesDir };
}
