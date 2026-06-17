import assert from "node:assert/strict";
import { ShortCircuit } from "../dist/core/short-circuit.js";
import type {
	Autocomplete,
	AutocompleteOptions,
	CollectedFont,
	Confirm,
	CssProperties,
	DirectoryPicker,
	DirectoryPickerOptions,
	ErrorHandler,
	FallbackVariant,
	FamilyProperties,
	FamilySuggestions,
	Fetcher,
	Filesystem,
	FontFaceMetrics,
	FontMetricsResolver,
	FontsManager,
	GenericFallbackName,
	Hasher,
	Logger,
	MinimalFamily,
	Multiselect,
	MultiselectOptions,
	Progress,
	Search,
	Spinner,
	SystemFallbacksProvider,
	Text,
	TextOptions,
	TextStyler,
} from "../dist/types.js";

export class FakeTextStyler implements TextStyler {
	blue(msg: string): string {
		return msg;
	}

	green(msg: string): string {
		return msg;
	}

	bgGreen(msg: string): string {
		return msg;
	}
}

export class FakeLogger implements Logger {
	readonly steps: Array<string> = [];
	readonly warns: Array<string> = [];

	step(msg: string): void {
		this.steps.push(msg);
	}

	warn(msg: string): void {
		this.warns.push(msg);
	}
}

/**
 * Multiselect fake. By default the user "selects" every offered option;
 * pass a handler to return a specific subset instead. Reuse a single instance
 * as the `createMultiselect` factory's return value to accumulate every call.
 */
export class FakeMultiselect implements Multiselect {
	readonly calls: Array<MultiselectOptions<any>> = [];
	#handler: (options: MultiselectOptions<any>) => Array<any>;

	constructor(
		handler: (options: MultiselectOptions<any>) => Array<any> = (o) =>
			o.options.map((opt) => opt.value),
	) {
		this.#handler = handler;
	}

	async run<T>(options: MultiselectOptions<T>): Promise<Array<T>> {
		this.calls.push(options);
		return this.#handler(options);
	}
}

export class FakeText implements Text {
	readonly calls: Array<TextOptions> = [];
	#handler: (options: TextOptions) => string;

	constructor(
		handler: (options: TextOptions) => string = (o) => o.initialValue ?? "",
	) {
		this.#handler = handler;
	}

	async run(options: TextOptions): Promise<string> {
		this.calls.push(options);
		return this.#handler(options);
	}
}

export class FakeAutocomplete implements Autocomplete {
	readonly calls: Array<AutocompleteOptions<any>> = [];
	#handler: (options: AutocompleteOptions<any>) => any;

	constructor(handler: (options: AutocompleteOptions<any>) => any) {
		this.#handler = handler;
	}

	async run<T>(options: AutocompleteOptions<T>): Promise<T> {
		this.calls.push(options);
		return this.#handler(options);
	}
}

export class FakeDirectoryPicker implements DirectoryPicker {
	readonly calls: Array<DirectoryPickerOptions> = [];
	#handler: (options: DirectoryPickerOptions) => string;

	constructor(handler: (options: DirectoryPickerOptions) => string) {
		this.#handler = handler;
	}

	async pick(options: DirectoryPickerOptions): Promise<string> {
		this.calls.push(options);
		return this.#handler(options);
	}
}

export class FakeFilesystem implements Filesystem {
	readonly mkdirs: Array<string> = [];
	readonly writes: Array<{ path: string; contents: Buffer }> = [];
	#isDirectory: (path: string | undefined) => string | undefined;

	constructor(
		options: {
			isDirectory?: (path: string | undefined) => string | undefined;
		} = {},
	) {
		this.#isDirectory = options.isDirectory ?? (() => undefined);
	}

	async mkdir(path: string): Promise<void> {
		this.mkdirs.push(path);
	}

	async writeFile(path: string, contents: Buffer): Promise<void> {
		this.writes.push({ path, contents });
	}

	async isDirectory(path: string | undefined): Promise<string | undefined> {
		return this.#isDirectory(path);
	}
}

export class FakeProgress implements Progress {
	readonly events: Array<{ type: string; msg?: string; step?: number }> = [];

	start(msg: string): void {
		this.events.push({ type: "start", msg });
	}

	advance(step: number): void {
		this.events.push({ type: "advance", step });
	}

	stop(msg: string): void {
		this.events.push({ type: "stop", msg });
	}

	error(msg: string): void {
		this.events.push({ type: "error", msg });
	}
}

export class FakeHasher implements Hasher {
	#value: string;

	constructor(value = "deadbeef") {
		this.#value = value;
	}

	hash(): string {
		return this.#value;
	}
}

export class FakeSearch<T extends Record<string, any>> implements Search<T> {
	readonly items: Array<T>;
	readonly total: number;
	#results: Array<T>;

	constructor(items: Array<T>, results: Array<T> = []) {
		this.items = items;
		this.total = items.length;
		this.#results = results;
	}

	search(): Array<T> {
		return this.#results;
	}
}

export class FakeSpinner implements Spinner {
	readonly starts: Array<string> = [];
	readonly stops: Array<string> = [];

	start(msg: string): void {
		this.starts.push(msg);
	}

	stop(msg: string): void {
		this.stops.push(msg);
	}
}

export class FakeConfirm implements Confirm {
	readonly calls: Array<string> = [];
	#handler: (message: string) => boolean;

	constructor(handler: (message: string) => boolean = () => true) {
		this.#handler = handler;
	}

	async run(message: string): Promise<boolean> {
		this.calls.push(message);
		return this.#handler(message);
	}
}

export class FakeErrorHandler implements ErrorHandler {
	readonly errors: Array<unknown> = [];

	onError(error: unknown): void {
		this.errors.push(error);
	}
}

const SAMPLE_METRICS: FontFaceMetrics = {
	ascent: 1000,
	descent: -200,
	lineGap: 0,
	unitsPerEm: 1000,
	xWidthAvg: 500,
};

/**
 * SystemFallbacksProvider fake. Maps `sans-serif` to `Arial` by default; pass a
 * handler to drive other generics. Records every `getLocalFonts` call.
 */
export class FakeSystemFallbacksProvider implements SystemFallbacksProvider {
	readonly calls: Array<{
		fallback: GenericFallbackName;
		variant: FallbackVariant;
	}> = [];
	#getLocalFonts: (
		fallback: GenericFallbackName,
		variant: FallbackVariant,
	) => Array<string> | null;

	constructor(
		getLocalFonts: (
			fallback: GenericFallbackName,
			variant: FallbackVariant,
		) => Array<string> | null = (fallback) =>
			fallback === "sans-serif" ? ["Arial"] : null,
	) {
		this.#getLocalFonts = getLocalFonts;
	}

	getLocalFonts(
		fallback: GenericFallbackName,
		variant: FallbackVariant,
	): Array<string> | null {
		this.calls.push({ fallback, variant });
		return this.#getLocalFonts(fallback, variant);
	}

	getMetricsForLocalFont(): FontFaceMetrics {
		return SAMPLE_METRICS;
	}
}

/**
 * FontMetricsResolver fake. Returns fixed metrics and a fixed, recognizable
 * override descriptor so tests can assert it reaches the generated CSS.
 */
export class FakeFontMetricsResolver implements FontMetricsResolver {
	readonly metricsCalls: Array<{ name: string; font: CollectedFont }> = [];
	readonly overrideCalls: Array<{
		metrics: FontFaceMetrics;
		fallbackMetrics: FontFaceMetrics;
	}> = [];

	async getMetrics(
		name: string,
		font: CollectedFont,
	): Promise<FontFaceMetrics> {
		this.metricsCalls.push({ name, font });
		return SAMPLE_METRICS;
	}

	getMetricOverrides(options: {
		metrics: FontFaceMetrics;
		fallbackMetrics: FontFaceMetrics;
	}): CssProperties {
		this.overrideCalls.push(options);
		return { "size-adjust": "90%" };
	}
}

export class FakeFetcher implements Fetcher {
	readonly urls: Array<string> = [];
	#handler: (url: string) => Buffer;

	constructor(
		handler: (url: string) => Buffer = () => Buffer.from("font-bytes"),
	) {
		this.#handler = handler;
	}

	async fetch(url: string): Promise<Buffer> {
		this.urls.push(url);
		return this.#handler(url);
	}
}

type ResolveResult = Awaited<ReturnType<FontsManager["resolve"]>>;

/**
 * FontsManager fake. Defaults return an empty family list and resolve to no
 * fonts; pass handlers to drive a specific flow. Records every `resolve` call
 * so tests can assert which family/properties were chosen.
 */
export class FakeFontsManager implements FontsManager {
	readonly resolveCalls: Array<{
		family: MinimalFamily;
		properties: FamilyProperties;
	}> = [];
	#families: Array<MinimalFamily>;
	#suggestions: (family: MinimalFamily) => FamilySuggestions | undefined;
	#resolve: (
		family: MinimalFamily,
		properties: FamilyProperties,
	) => ResolveResult;

	constructor(
		options: {
			families?: Array<MinimalFamily>;
			suggestions?:
				| FamilySuggestions
				| undefined
				| ((family: MinimalFamily) => FamilySuggestions | undefined);
			resolve?: (
				family: MinimalFamily,
				properties: FamilyProperties,
			) => ResolveResult;
		} = {},
	) {
		this.#families = options.families ?? [];
		this.#suggestions =
			typeof options.suggestions === "function"
				? options.suggestions
				: () => options.suggestions as FamilySuggestions | undefined;
		this.#resolve =
			options.resolve ?? (() => ({ fonts: [], fallbacks: undefined }));
	}

	async list(): Promise<Array<MinimalFamily>> {
		return this.#families;
	}

	async getSuggestions(
		family: MinimalFamily,
	): Promise<FamilySuggestions | undefined> {
		return this.#suggestions(family);
	}

	async resolve(
		family: MinimalFamily,
		properties: FamilyProperties,
	): Promise<ResolveResult> {
		this.resolveCalls.push({ family, properties });
		return this.#resolve(family, properties);
	}
}

/** Assert that `fn` rejects with a `ShortCircuit` whose `data` matches `expected`. */
export async function assertShortCircuit(
	fn: () => Promise<unknown>,
	expected: ShortCircuit["data"],
): Promise<void> {
	await assert.rejects(fn, (err: unknown) => {
		assert.ok(
			err instanceof ShortCircuit,
			`expected ShortCircuit, got ${String(err)}`,
		);
		assert.deepEqual(err.data, expected);
		return true;
	});
}
