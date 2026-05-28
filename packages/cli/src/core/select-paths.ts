import type { DirectoryPicker } from "../types.js";

interface Options {
	directoryPicker: DirectoryPicker;
	root: string;
}

// TODO: project detection? eg. vite, laravel, rails...
// https://github.com/railwayapp/railpack/blob/main/core/providers
// https://github.com/netlify/build/tree/main/packages/build-info/src/frameworks
// https://github.com/vercel/vercel/blob/main/packages/frameworks/src/frameworks.ts

export async function selectPaths(options: Options): Promise<{
	fonts: string;
	styles: string;
}> {
	const fonts = await options.directoryPicker.pick({
		message: "Where would you like font files to be saved? (e.g. public/fonts)",
		root: options.root,
	});
	const styles = await options.directoryPicker.pick({
		message: "Where would you like CSS to be saved? (e.g. src/styles)",
		root: options.root,
	});

	return { fonts, styles };
}
