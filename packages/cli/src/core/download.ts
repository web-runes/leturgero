import { progress } from "@clack/prompts";
import { ClackCancelError } from "../infra/clack-error-handler.js";

interface Options {
	fontsPath: string;
	sources: Array<string>;
}

// TODO: abstract clack

export async function download(options: Options): Promise<void> {
	const contents: Array<string> = [];
	const total = options.sources.length;
	const prog = progress({
		max: total,
	});
	prog.start(`Downloading (0/${total})...`);

	try {
		await Promise.all(
			options.sources.map(async (source) => {
				const response = await fetch(source);
				contents.push(await response.text());
				prog.advance(1, `Downloading (${contents.length}/${total})...`);
			}),
		);
		prog.stop(`Downloaded (${total}/${total})`);
	} catch {
		prog.error("An error occured while downloading, aborting");
		throw new ClackCancelError();
	}
}
