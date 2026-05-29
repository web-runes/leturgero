import type { DirectoryPicker, Text } from "../types.js";

interface Options {
	directoryPicker: DirectoryPicker;
	text: Text;
	root: string;
}

export async function selectPaths(options: Options): Promise<{
	publicDir: string;
	publicFontsDir: string;
	stylesDir: string;
}> {
	const publicDir = await options.directoryPicker.pick({
		message: "Where are your static assets saved? (e.g. public)",
		root: options.root,
	});
	const publicFontsDir = await options.text.run({
		message:
			"Where would you like font files to be saved inside it? (e.g. fonts)",
		initialValue: "./fonts",
		validate(value) {
			if (!value) return "Please enter a value";
			if (value.match(/[^\x20-\x7E]/g) !== null)
				return `Invalid non-printable character present!`;
		},
	});
	const stylesDir = await options.directoryPicker.pick({
		message: "Where would you like CSS to be saved? (e.g. src/styles)",
		root: options.root,
	});

	return { publicDir, publicFontsDir, stylesDir };
}
