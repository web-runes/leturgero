import type { DirectoryPicker, Filesystem, Logger, Text } from "../types.js";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	type InferArgs,
} from "./args.js";
import { ShortCircuit } from "./short-circuit.js";

const PUBLIC_DIR_CLI_NAME = "public-dir";

export const args = {
	publicDir: {
		cliName: PUBLIC_DIR_CLI_NAME,
		type: "string",
		description: "Absolute path to the directory where static assets are saved",
	},
	publicFontsDir: {
		cliName: "public-fonts-dir",
		type: "string",
		description: `Path relative to --${PUBLIC_DIR_CLI_NAME} where to save font files. Usually fonts`,
	},
	stylesDir: {
		cliName: "styles-dir",
		type: "string",
		description: "Absolute path to the directory where CSS files are saved",
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

function validateFontsDir(value: string | undefined): string | undefined {
	if (!value) return;
	if (value.match(/[^\x20-\x7E]/g) !== null)
		return "Invalid non-printable character present";
}

export async function validateSelectPathsArgs(
	values: Options["args"],
	options: { filesystem: Filesystem },
) {
	const publicDirError = await options.filesystem.isDirectory(values.publicDir);
	if (publicDirError)
		throw new ShortCircuit({ type: "error", error: publicDirError });
	const publicFontsDirError = validateFontsDir(values.publicFontsDir);
	if (publicFontsDirError)
		throw new ShortCircuit({ type: "error", error: publicFontsDirError });
	const stylesDirError = await options.filesystem.isDirectory(values.stylesDir);
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
			message:
				"Where are all your static assets saved? (e.g. public) Saving to a subfolder is the next question",
			root: options.root,
		}));
	const publicFontsDir =
		options.args.publicFontsDir ??
		(await options.text.run({
			message:
				"Where would you like font files to be saved inside it? (e.g. fonts)",
			initialValue: "fonts",
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
