import { join } from "node:path";
import type { Filesystem, Logger } from "../types.js";

interface Options {
	cssVariable: string;
	css: string;
	filesystem: Filesystem;
	stylesDir: string;
	logger: Logger;
}

export async function saveCssToDisk(options: Options): Promise<void> {
	const filename = `${options.cssVariable.slice(2)}.css`;
	await options.filesystem.writeFile(
		join(options.stylesDir, filename),
		Buffer.from(options.css),
	);
	options.logger.step(`Saved ${filename} to disk`);
}
