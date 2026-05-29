import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Logger } from "../types.js";

interface Options {
	filenameToContents: Map<string, Buffer>;
	writeFile: (path: string, contents: Buffer) => Promise<void>;
	publicDir: string;
	publicFontsDir: string;
	logger: Logger;
}

export async function saveFontsToDisk(options: Options): Promise<void> {
	const fontsDir = join(options.publicDir, options.publicFontsDir);
	await mkdir(fontsDir, { recursive: true });
	await Promise.all(
		options.filenameToContents
			.entries()
			.map(([filename, contents]) =>
				options.writeFile(join(fontsDir, filename), contents),
			),
	);
	const total = options.filenameToContents.size;
	options.logger.step(
		`Saved ${total} font file${total === 1 ? "" : "s"} to disk`,
	);
}
