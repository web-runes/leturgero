import { join } from "node:path";

interface Options {
	filenameToContents: Map<string, Buffer>;
	writeFile: (path: string, contents: Buffer) => Promise<void>;
	fontsDir: string;
}

export async function saveToDisk(options: Options): Promise<void> {
	await Promise.all(
		options.filenameToContents
			.entries()
			.map(([filename, contents]) =>
				options.writeFile(join(options.fontsDir, filename), contents),
			),
	);
}
