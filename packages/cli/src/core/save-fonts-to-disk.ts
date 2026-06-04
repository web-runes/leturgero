import { join } from "node:path";
import type { Filesystem, Logger } from "../types.js";

interface Options {
	filenameToContents: Map<string, Buffer>;
	filesystem: Filesystem;
	publicDir: string;
	publicFontsDir: string;
	logger: Logger;
}

export async function saveFontsToDisk(options: Options): Promise<void> {
	const fontsDir = join(options.publicDir, options.publicFontsDir);
	await options.filesystem.mkdir(fontsDir);
	await Promise.all(
		options.filenameToContents
			.entries()
			.map(([filename, contents]) =>
				options.filesystem.writeFile(join(fontsDir, filename), contents),
			),
	);
	const total = options.filenameToContents.size;
	options.logger.step(
		`Saved ${total} font file${total === 1 ? "" : "s"} to disk`,
	);
}
