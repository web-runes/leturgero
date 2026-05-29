import { extname, join, relative } from "node:path";
import type { FontFaceData, RemoteFontSource } from "unifont";
import type { Hasher, Progress } from "../types.js";
import { kebabize } from "../utils.js";

interface Options {
	cssVariable: string;
	fonts: Array<FontFaceData>;
	hasher: Hasher;
	publicDir: string;
	publicFontsDir: string;
	createProgress: () => Progress;
	createCancelError: () => Error;
	fetch: (url: string) => Promise<Buffer>;
}

const FONT_TYPES = ["woff2", "woff", "otf", "ttf", "eot"] as const;

type FontType = (typeof FONT_TYPES)[number];

const FONT_FORMATS: Array<{ type: FontType; format: string }> = [
	{ type: "woff2", format: "woff2" },
	{ type: "woff", format: "woff" },
	{ type: "otf", format: "opentype" },
	{ type: "ttf", format: "truetype" },
	{ type: "eot", format: "embedded-opentype" },
];

function getFormat(source: RemoteFontSource) {
	return (
		FONT_FORMATS.find((e) => e.format === source.format) ??
		FONT_FORMATS.find((e) => e.type === extname(source.url).slice(1)) ??
		FONT_FORMATS[0]
	);
}

function prependForwardSlash(str: string): string {
	if (str[0] !== "/") {
		return `/${str}`;
	}
	return str;
}

export async function proxySources(options: Options): Promise<{
	fonts: Array<FontFaceData>;
	filenameToContents: Map<string, Buffer>;
}> {
	const filenameToContents = new Map<string, Buffer>();
	const prog = options.createProgress();
	prog.start("Downloading font files...");

	try {
		const fonts: Array<FontFaceData> = await Promise.all(
			options.fonts.map(async (font) => ({
				...font,
				src: await Promise.all(
					font.src.map(async (src) => {
						if ("name" in src) return { ...src };

						const contents = await options.fetch(src.url);
						prog.advance(1);

						const format = getFormat(src);
						const filename = `${kebabize(
							[
								options.cssVariable.slice(2),
								font.weight?.toString(),
								font.style,
								font.meta?.subset,
							]
								.filter(Boolean)
								.join("-"),
						)}.${options.hasher.hash(contents)}.${format.type}`;

						filenameToContents.set(filename, contents);

						return {
							url: prependForwardSlash(
								join(
									relative(
										options.publicDir,
										join(options.publicDir, options.publicFontsDir),
									),
									filename,
								),
							),
							originalURL: src.url,
							format: format.format,
							tech: src.tech,
						};
					}),
				),
			})),
		);

		prog.stop("Downloaded");

		return {
			filenameToContents,
			fonts,
		};
	} catch {
		prog.error("An error occured while downloading, aborting");
		throw options.createCancelError();
	}
}
