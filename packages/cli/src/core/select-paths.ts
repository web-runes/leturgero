import type { DirectoryPicker } from "../types.js";

interface Options {
	directoryPicker: DirectoryPicker;
	root: string;
}

export async function selectPaths(options: Options): Promise<{
	fonts: string;
	styles: string;
}> {
	const fonts = await options.directoryPicker.pick({
		message: "Select where to download fonts (e.g. public/fonts)",
		root: options.root,
	});
	const styles = await options.directoryPicker.pick({
		message: "Select where to output CSS (e.g. src/styles)",
		root: options.root,
	});

	return { fonts, styles };
}
