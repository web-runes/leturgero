import type { DirectoryPicker, Logger, Text } from "../types.js";

interface Options {
	directoryPicker: DirectoryPicker;
	text: Text;
	root: string;
	isAgent: boolean;
	args: {
		publicDir: string | undefined;
		publicFontsDir: string | undefined;
		stylesDir: string | undefined;
	};
	logger: Logger;
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
		options.logger.warn(
			"Following flags must be set: --public-dir, --public-fonts-dir, --styles-dir. Run the command again with --help to know the prerequisites for each.",
		);
		process.exit(0);
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
				if (value.match(/[^\x20-\x7E]/g) !== null)
					return "Invalid non-printable character present!";
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
