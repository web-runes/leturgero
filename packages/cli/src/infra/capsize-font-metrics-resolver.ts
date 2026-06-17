import { type Font, fromBuffer } from "@capsizecss/unpack";
import type {
	CollectedFont,
	CssProperties,
	FontFaceMetrics,
	FontMetricsResolver,
} from "../types.js";

// Source: https://github.com/unjs/fontaine/blob/main/src/metrics.ts
function filterRequiredMetrics({
	ascent,
	descent,
	lineGap,
	unitsPerEm,
	xWidthAvg,
}: Pick<
	Font,
	"ascent" | "descent" | "lineGap" | "unitsPerEm" | "xWidthAvg"
>): FontFaceMetrics {
	return {
		ascent,
		descent,
		lineGap,
		unitsPerEm,
		xWidthAvg,
	};
}

// Source: https://github.com/seek-oss/capsize/blob/b752693428b45994442433f7e3476ca4e3e3c507/packages/core/src/round.ts
function round(value: number): number {
	return Number.parseFloat(value.toFixed(4));
}

// Source: https://github.com/seek-oss/capsize/blob/b752693428b45994442433f7e3476ca4e3e3c507/packages/core/src/createFontStack.ts#L5
function toPercentString(value: number): string {
	return `${round(value * 100)}%`;
}

export class CapsizeFontMetricsResolver implements FontMetricsResolver {
	// Metrics for the preferred font are the same regardless of variant, so we
	// only ever read each family's bytes once.
	readonly #cache: Record<string, FontFaceMetrics> = {};

	async getMetrics(
		name: string,
		font: CollectedFont,
	): Promise<FontFaceMetrics> {
		const cached = this.#cache[name];
		if (cached) {
			return cached;
		}
		const metrics = filterRequiredMetrics(await fromBuffer(font.buffer));
		this.#cache[name] = metrics;
		return metrics;
	}

	// Adapted from Capsize
	// Source: https://github.com/seek-oss/capsize/blob/b752693428b45994442433f7e3476ca4e3e3c507/packages/core/src/createFontStack.ts
	getMetricOverrides({
		metrics,
		fallbackMetrics,
	}: {
		metrics: FontFaceMetrics;
		fallbackMetrics: FontFaceMetrics;
	}): CssProperties {
		// Calculate size adjust
		const preferredFontXAvgRatio = metrics.xWidthAvg / metrics.unitsPerEm;
		const fallbackFontXAvgRatio =
			fallbackMetrics.xWidthAvg / fallbackMetrics.unitsPerEm;

		const sizeAdjust =
			preferredFontXAvgRatio && fallbackFontXAvgRatio
				? preferredFontXAvgRatio / fallbackFontXAvgRatio
				: 1;

		const adjustedEmSquare = metrics.unitsPerEm * sizeAdjust;

		// Calculate metric overrides for preferred font
		const ascentOverride = metrics.ascent / adjustedEmSquare;
		const descentOverride = Math.abs(metrics.descent) / adjustedEmSquare;
		const lineGapOverride = metrics.lineGap / adjustedEmSquare;

		// Calculate metric overrides for fallback font
		const fallbackAscentOverride = fallbackMetrics.ascent / adjustedEmSquare;
		const fallbackDescentOverride =
			Math.abs(fallbackMetrics.descent) / adjustedEmSquare;
		const fallbackLineGapOverride = fallbackMetrics.lineGap / adjustedEmSquare;

		return {
			"size-adjust":
				sizeAdjust && sizeAdjust !== 1
					? toPercentString(sizeAdjust)
					: undefined,
			"ascent-override":
				ascentOverride && ascentOverride !== fallbackAscentOverride
					? toPercentString(ascentOverride)
					: undefined,
			"descent-override":
				descentOverride && descentOverride !== fallbackDescentOverride
					? toPercentString(descentOverride)
					: undefined,
			"line-gap-override":
				lineGapOverride !== fallbackLineGapOverride
					? toPercentString(lineGapOverride)
					: undefined,
		};
	}
}
