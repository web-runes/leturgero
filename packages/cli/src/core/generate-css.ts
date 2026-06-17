import type { FontFace } from "../types.js";
import {
	fontFaceToProperties,
	handleValueWithSpaces,
	renderFontFace,
} from "../utils.js";

interface Options {
	family: string;
	cssVariable: string;
	fallbacks: Array<string>;
	fonts: Array<FontFace>;
}

function renderCssVariable(key: string, values: Array<string>): string {
	return `:root {\n  ${key}: ${values.map((v) => handleValueWithSpaces(v)).join(`, `)};\n}`;
}

export function generateCss(options: Options): string {
	return [
		renderCssVariable(options.cssVariable, [
			options.family,
			...options.fallbacks,
		]),
		...options.fonts.map((font) =>
			renderFontFace({
				"font-family": handleValueWithSpaces(font.family ?? options.family),
				...fontFaceToProperties(font),
				...font.descriptors,
			}),
		),
	].join("\n\n");
}
