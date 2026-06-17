import type { Option } from "@clack/prompts";
import type { FontFaceData, FontStyles, ResolveFontOptions } from "unifont";

export interface Spinner {
	start: (msg: string) => void;
	stop: (msg: string) => void;
}

export type FontFormat = ResolveFontOptions["formats"][number];

export interface FamilyProperties {
	weights: Array<string>;
	styles: Array<FontStyles>;
	formats: Array<FontFormat>;
	subsets: Array<string> | undefined;
}

export type FamilySuggestions = Partial<FamilyProperties>;

export interface MinimalFamily {
	name: string;
	provider: string;
}

export interface FontsManager {
	list: () => Promise<Array<MinimalFamily>>;
	getSuggestions: (
		family: MinimalFamily,
	) => Promise<FamilySuggestions | undefined>;
	resolve: (
		family: MinimalFamily,
		properties: FamilyProperties,
	) => Promise<{
		fonts: Array<FontFace>;
		fallbacks: Array<string> | undefined;
	}>;
}

export interface ErrorHandler {
	onError: (error: unknown) => void;
}

export interface AutocompleteOptions<T> {
	message: string;
	onSearch: (input: string) => Array<Option<T>>;
}

export interface Autocomplete {
	run: <T>(options: AutocompleteOptions<T>) => Promise<T>;
}

export interface Search<T extends Record<string, any>> {
	search: (input: string) => Array<T>;
	readonly total: number;
	readonly items: Array<T>;
}

export interface MultiselectOptions<T> {
	message: string;
	options: Array<Option<T>>;
}

export interface Multiselect {
	run: <T>(options: MultiselectOptions<T>) => Promise<Array<T>>;
}

export interface Logger {
	step: (msg: string) => void;
	warn: (msg: string) => void;
}

export interface DirectoryPickerOptions {
	message: string;
	root: string;
}

export interface DirectoryPicker {
	pick: (options: DirectoryPickerOptions) => Promise<string>;
}

export interface Hasher {
	hash: (input: Buffer) => string;
}

export interface Progress {
	start: (msg: string) => void;
	advance: (step: number) => void;
	stop: (msg: string) => void;
	error: (msg: string) => void;
}

export interface TextOptions {
	message: string;
	initialValue?: string;
	validate?: (value: string | undefined) => string | undefined;
}

export interface Text {
	run: (options: TextOptions) => Promise<string>;
}

export interface Confirm {
	run: (message: string) => Promise<boolean>;
}

export interface Filesystem {
	mkdir: (path: string) => Promise<void>;
	writeFile: (path: string, contents: Buffer) => Promise<void>;
	isDirectory: (path: string | undefined) => Promise<string | undefined>;
}

export interface Fetcher {
	fetch: (url: string) => Promise<Buffer>;
}

export interface TextStyler {
	blue: (msg: string) => string;
	green: (msg: string) => string;
	bgGreen: (msg: string) => string;
}

/** A set of `@font-face` descriptors, keyed by CSS property name. */
export type CssProperties = Record<string, string | undefined>;

/** The subset of font metrics needed to compute fallback overrides. */
export interface FontFaceMetrics {
	ascent: number;
	descent: number;
	lineGap: number;
	unitsPerEm: number;
	xWidthAvg: number;
}

/**
 * Generic CSS font families that can be mapped to concrete local fonts.
 * See https://developer.mozilla.org/en-US/docs/Web/CSS/font-family#generic-name.
 */
export type GenericFallbackName =
	| "serif"
	| "sans-serif"
	| "monospace"
	| "cursive"
	| "fantasy"
	| "system-ui"
	| "ui-serif"
	| "ui-sans-serif"
	| "ui-monospace"
	| "ui-rounded"
	| "math"
	| "emoji"
	| "fangsong";

/** Local fonts come in a couple of variants whose metrics differ. */
export type FallbackVariant = "normal" | "bold";

/** A downloaded font paired with the contents needed to read its metrics. */
export interface CollectedFont {
	data: FontFace;
	buffer: Buffer;
}

/**
 * A font face to render. Extends unifont's data with a `font-family` override
 * (defaults to the chosen family) and extra descriptors, so optimized fallbacks
 * flow through the same rendering path as regular fonts. This is the font type
 * used across the app; unifont's `FontFaceData` only appears at its boundary.
 */
export interface FontFace extends FontFaceData {
	family: string | undefined;
	descriptors: CssProperties | undefined;
}

/**
 * Maps a generic family (e.g. `sans-serif`) to the concrete system fonts a
 * browser is likely to use for it, along with their known metrics.
 */
export interface SystemFallbacksProvider {
	getLocalFonts: (
		fallback: GenericFallbackName,
		variant: FallbackVariant,
	) => Array<string> | null;
	getMetricsForLocalFont: (family: string) => FontFaceMetrics;
}

/** Reads font metrics and computes the descriptors that adjust a fallback. */
export interface FontMetricsResolver {
	getMetrics: (name: string, font: CollectedFont) => Promise<FontFaceMetrics>;
	/**
	 * Returns the `@font-face` descriptors (e.g. `size-adjust`, `ascent-override`)
	 * that make a fallback font match the metrics of the preferred one.
	 */
	getMetricOverrides: (options: {
		metrics: FontFaceMetrics;
		fallbackMetrics: FontFaceMetrics;
	}) => CssProperties;
}
