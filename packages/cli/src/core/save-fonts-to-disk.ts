import { join } from "node:path";
import type { Logger } from "../types.js";

interface Options {
	filenameToContents: Map<string, Buffer>;
	writeFile: (path: string, contents: Buffer) => Promise<void>;
	fontsDir: string;
	logger: Logger;
}

export async function saveFontsToDisk(options: Options): Promise<void> {
	await Promise.all(
		options.filenameToContents
			.entries()
			.map(([filename, contents]) =>
				options.writeFile(join(options.fontsDir, filename), contents),
			),
	);
	const total = options.filenameToContents.size;
	options.logger.step(
		`Saved ${total} font file${total === 1 ? "" : "s"} to disk`,
	);
}
