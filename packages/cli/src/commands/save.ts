// TODO:

import type { FontStyles } from "unifont";
import type { FontFormat } from "../types.js";

// css variable
// proxy
// save to disk
// generate css

interface Options {
	family: string;
	paths: {
		publicDir: string | undefined;
		publicFontsDir: string | undefined;
		stylesDir: string | undefined;
	};
	properties: {
		weights: Array<number>;
		styles: Array<FontStyles>;
		subsets: Array<string> | undefined;
		formats: Array<FontFormat>;
	};
	cssVariable: string | undefined;
}

export async function saveImpl(_options: Options): Promise<void> {
	// TODO: find exact family or abort
	// TODO: paths
	// TODO: cssVariable
}
