import type { FontFaceData } from "unifont";

interface Options {
	family: string;
	cssVariable: string;
	fallbacks: Array<string>;
	fonts: Array<FontFaceData>;
}

type CssProperties = Record<string, string | undefined>;

function unifontFontFaceDataToProperties(
	font: Partial<FontFaceData>,
): CssProperties {
	return {
		src: font.src ? renderFontSrc(font.src) : undefined,
		"font-display": font.display ?? "swap",
		"unicode-range": font.unicodeRange?.length
			? font.unicodeRange.join(",")
			: undefined,
		"font-weight": renderFontWeight(font.weight),
		"font-style": font.style,
		"font-stretch": font.stretch,
		"font-feature-settings": font.featureSettings,
		"font-variation-settings": font.variationSettings,
	};
}

function renderFontWeight(weight: FontFaceData["weight"]): string | undefined {
	return Array.isArray(weight) ? weight.join(" ") : weight?.toString();
}

function renderFontSrc(
	sources: Exclude<FontFaceData["src"][number], string>[],
): string {
	return sources
		.map((src) => {
			if ("name" in src) {
				return `local("${src.name}")`;
			}
			let rendered = `url("${src.url}")`;
			if (src.format) {
				rendered += ` format("${src.format}")`;
			}
			if (src.tech) {
				rendered += ` tech(${src.tech})`;
			}
			return rendered;
		})
		.join(", ");
}

function renderFontFace(properties: CssProperties): string {
	return `@font-face {\n${Object.entries(properties)
		.filter(([, value]) => Boolean(value))
		.map(([key, value]) => `  ${key}: ${value};`)
		.join("\n")}\n}`;
}

function renderCssVariable(key: string, values: Array<string>): string {
	return `:root {\n  ${key}: ${values.map((v) => handleValueWithSpaces(v)).join(`, `)};\n}`;
}

function withFamily(family: string, properties: CssProperties): CssProperties {
	return {
		"font-family": handleValueWithSpaces(family),
		...properties,
	};
}

const SPACE_RE = /\s/;

/** If the value contains spaces (which would be incorrectly interpreted), we wrap it in quotes. */
function handleValueWithSpaces(value: string): string {
	if (SPACE_RE.test(value)) {
		return JSON.stringify(value);
	}
	return value;
}

export function generateCss(options: Options): string {
	return [
		renderCssVariable(options.cssVariable, [
			options.family,
			...options.fallbacks,
		]),
		...options.fonts.map((font) =>
			renderFontFace(
				withFamily(options.family, unifontFontFaceDataToProperties(font)),
			),
		),
	].join("\n\n");
}
