import { lstat } from "node:fs/promises";
import type { DirectoryPicker, Logger, Text } from "../types.js";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	type InferArgs,
} from "./args.js";

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

// TODO: instead of unhandled errors, print + abort
// TODO: may need to become dependencies

async function validateDirectory(
	value: string | undefined,
): Promise<string | undefined> {
	if (!value) return;
	const stats = await lstat(value).catch(() => {
		throw new Error("Path does not exist");
	});
	if (!stats.isDirectory()) {
		throw new Error("Not a directory");
	}
	return value;
}

function validateFontsDir(value: string | undefined): string | undefined {
	if (!value) return;
	if (value.match(/[^\x20-\x7E]/g) !== null)
		throw new Error("Invalid non-printable character present!");
	return value;
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
		process.exit(0);
	}

	const publicDir =
		(await validateDirectory(options.args.publicDir)) ??
		(await options.directoryPicker.pick({
			message: "Where are your static assets saved? (e.g. public)",
			root: options.root,
		}));
	const publicFontsDir =
		validateFontsDir(options.args.publicFontsDir) ??
		(await options.text.run({
			message:
				"Where would you like font files to be saved inside it? (e.g. fonts)",
			initialValue: "./fonts",
			validate(value) {
				if (!value) return "Please enter a value";
				try {
					return validateFontsDir(value);
				} catch (error) {
					return (error as Error).message;
				}
			},
		}));
	const stylesDir =
		(await validateDirectory(options.args.stylesDir)) ??
		(await options.directoryPicker.pick({
			message: "Where would you like CSS to be saved? (e.g. src/styles)",
			root: options.root,
		}));

	return { publicDir, publicFontsDir, stylesDir };
}
