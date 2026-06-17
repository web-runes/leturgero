import { extname, join, relative } from "node:path";
import type { RemoteFontSource } from "unifont";
import type {
	CollectedFont,
	Fetcher,
	FontFace,
	Hasher,
	Progress,
} from "../types.js";
import { kebabize } from "../utils.js";
import { ShortCircuit } from "./short-circuit.js";

interface Options {
	cssVariable: string;
	fonts: Array<FontFace>;
	hasher: Hasher;
	publicDir: string;
	publicFontsDir: string;
	createProgress: () => Progress;
	fetcher: Fetcher;
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
	fonts: Array<FontFace>;
	filenameToContents: Map<string, Buffer>;
	/**
	 * Each downloaded font paired with the bytes of its first remote source, so
	 * its metrics can be read without re-deriving the mapping from filenames.
	 */
	collectedFonts: Array<CollectedFont>;
}> {
	const filenameToContents = new Map<string, Buffer>();
	const collectedFonts: Array<CollectedFont> = [];
	const prog = options.createProgress();
	prog.start("Downloading font files...");

	try {
		const fonts: Array<FontFace> = await Promise.all(
			options.fonts.map(async (font) => {
				// Any remote source of a font shares the same metrics (only the
				// container format differs), so we keep the first one we download.
				let buffer: Buffer | undefined;

				const proxied: FontFace = {
					...font,
					src: await Promise.all(
						font.src.map(async (src) => {
							if ("name" in src) return { ...src };

							const contents = await options.fetcher.fetch(src.url);
							prog.advance(1);
							buffer ??= contents;

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
				};

				if (buffer) {
					collectedFonts.push({ data: proxied, buffer });
				}

				return proxied;
			}),
		);

		prog.stop("Downloaded");

		return {
			filenameToContents,
			collectedFonts,
			fonts,
		};
	} catch {
		prog.error("An error occured while downloading, aborting");
		throw new ShortCircuit({ type: "cancel" });
	}
}
