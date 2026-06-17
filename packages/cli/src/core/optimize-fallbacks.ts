import type {
	CollectedFont,
	FallbackVariant,
	FontFace,
	FontMetricsResolver,
	SystemFallbacksProvider,
} from "../types.js";
import { isGenericFontFamily } from "../utils.js";

function deriveFallbackVariant(data: FontFace): FallbackVariant {
	const weight = data.weight;
	if (typeof weight === "number" && weight >= 700) {
		return "bold";
	}
	if (typeof weight === "string") {
		if (weight === "bold") return "bold";
		// Variable weights (e.g. "100 900") are treated as normal.
		if (weight.includes(" ")) return "normal";
		const n = Number.parseInt(weight, 10);
		if (!Number.isNaN(n) && n >= 700) return "bold";
	}
	return "normal";
}

interface Options {
	family: string;
	fallbacks: Array<string>;
	collectedFonts: Array<CollectedFont>;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
}

/**
 * Generates metric-adjusted `@font-face` rules for system fonts, so the layout
 * shift between the fallback and the downloaded font is minimized (CLS).
 *
 * Returns the new fallback list (with the synthetic families prepended) and the
 * CSS for those families, or `null` when no optimization can be inferred.
 *
 * Adapted from Astro's Fonts API.
 */
export async function optimizeFallbacks({
	family,
	fallbacks: _fallbacks,
	collectedFonts,
	systemFallbacksProvider,
	fontMetricsResolver,
}: Options): Promise<null | {
	fonts: Array<FontFace>;
	fallbacks: Array<string>;
}> {
	// We avoid mutating the original array
	let fallbacks = [..._fallbacks];

	if (fallbacks.length === 0 || collectedFonts.length === 0) {
		return null;
	}

	// The last element of the fallbacks is usually a generic family name (eg. serif)
	const lastFallback = fallbacks[fallbacks.length - 1];
	// If it's not a generic family name, we can't infer local fonts to be used as fallbacks
	if (!isGenericFontFamily(lastFallback)) {
		return null;
	}

	// For each collected font, the local fallback list may differ based on its
	// variant (e.g. bold fonts may map to a different local font than normal ones).
	const collectedWithLocalFonts = collectedFonts.map((collected) => ({
		collected,
		localFonts:
			systemFallbacksProvider.getLocalFonts(
				lastFallback,
				deriveFallbackVariant(collected.data),
			) ?? [],
	}));

	// Union of all local fonts seen across variants, preserving first-seen order.
	const uniqueLocalFonts: Array<string> = [];
	for (const { localFonts } of collectedWithLocalFonts) {
		for (const font of localFonts) {
			if (!uniqueLocalFonts.includes(font)) {
				uniqueLocalFonts.push(font);
			}
		}
	}

	// Some generic families do not have associated local fonts so we abort early
	if (uniqueLocalFonts.length === 0) {
		return null;
	}

	// If the family is already a system font, no need to generate fallbacks
	if (uniqueLocalFonts.includes(family)) {
		return null;
	}

	const nameForFont = (font: string) =>
		// We mustn't wrap in quotes because that's handled by the CSS renderer
		`${family} fallback: ${font}`;

	// We prepend the fallbacks with the local fonts
	fallbacks = [...uniqueLocalFonts.map(nameForFont), ...fallbacks];

	const fonts: Array<FontFace> = [];
	for (const { collected, localFonts } of collectedWithLocalFonts) {
		const metrics = await fontMetricsResolver.getMetrics(family, collected);
		for (const font of localFonts) {
			fonts.push({
				// Keep the variant's descriptors (weight, style, unicode-range...),
				// but point the source at the local system font.
				...collected.data,
				family: nameForFont(font),
				src: [{ name: font }],
				descriptors: fontMetricsResolver.getMetricOverrides({
					metrics,
					fallbackMetrics: systemFallbacksProvider.getMetricsForLocalFont(font),
				}),
			});
		}
	}

	return { fonts, fallbacks };
}
