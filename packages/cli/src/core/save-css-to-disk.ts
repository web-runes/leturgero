import { join } from "node:path";
import type { Logger } from "../types.js";

interface Options {
	cssVariable: string;
	css: string;
	writeFile: (path: string, contents: Buffer) => Promise<void>;
	stylesDir: string;
	logger: Logger;
}

export async function saveCssToDisk(options: Options): Promise<void> {
	const filename = `${options.cssVariable.slice(2)}.css`;
	await options.writeFile(
		join(options.stylesDir, filename),
		Buffer.from(options.css),
	);
	options.logger.step(`Saved ${filename} to disk`);
}
