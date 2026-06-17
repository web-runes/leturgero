import type { CssProperties, FontFace, GenericFallbackName } from "./types.js";

export function kebabize(str: string): string {
	return str.toLowerCase().replace(/\s+/g, "-");
}

const GENERIC_FONT_FAMILIES = [
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui",
	"ui-serif",
	"ui-sans-serif",
	"ui-monospace",
	"ui-rounded",
	"math",
	"emoji",
	"fangsong",
] as const satisfies Array<GenericFallbackName>;

/** Whether a font family name is one of the CSS generic families (e.g. `serif`). */
export function isGenericFontFamily(
	family: string,
): family is GenericFallbackName {
	return (GENERIC_FONT_FAMILIES as ReadonlyArray<string>).includes(family);
}

export function fontFaceToProperties(font: Partial<FontFace>): CssProperties {
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

function renderFontWeight(weight: FontFace["weight"]): string | undefined {
	return Array.isArray(weight) ? weight.join(" ") : weight?.toString();
}

export function renderFontSrc(
	sources: Exclude<FontFace["src"][number], string>[],
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

export function renderFontFace(properties: CssProperties): string {
	return `@font-face {\n${Object.entries(properties)
		.filter(([, value]) => Boolean(value))
		.map(([key, value]) => `  ${key}: ${value};`)
		.join("\n")}\n}`;
}

const SPACE_RE = /\s/;

/** If the value contains spaces (which would be incorrectly interpreted), we wrap it in quotes. */
export function handleValueWithSpaces(value: string): string {
	if (SPACE_RE.test(value)) {
		return JSON.stringify(value);
	}
	return value;
}
