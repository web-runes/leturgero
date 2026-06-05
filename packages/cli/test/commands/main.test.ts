import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { FontFaceData } from "unifont";
import { mainImpl } from "../../dist/commands/main.js";
import { ShortCircuit } from "../../dist/core/short-circuit.js";
import type { MinimalFamily } from "../../dist/types.js";
import {
	FakeAutocomplete,
	FakeConfirm,
	FakeDirectoryPicker,
	FakeErrorHandler,
	FakeFetcher,
	FakeFilesystem,
	FakeFontsManager,
	FakeHasher,
	FakeLogger,
	FakeMultiselect,
	FakeProgress,
	FakeSearch,
	FakeSpinner,
	FakeText,
} from "../helpers.ts";

const FAMILY: MinimalFamily = { name: "Inter", provider: "google" };

const RESOLVED_FONT: FontFaceData = {
	src: [{ url: "https://cdn.example/inter.woff2", format: "woff2" }],
	weight: 400,
	style: "normal",
};

// Every flag set so the flow never falls back to an interactive prompt.
const DEFAULT_ARGS = {
	publicDir: "/proj/public",
	publicFontsDir: "fonts",
	stylesDir: "/proj/src/styles",
	fontFamily: "Inter",
	weights: ["400"],
	styles: ["normal"] as Array<"normal" | "italic" | "oblique">,
	formats: ["woff2"] as Array<"woff2">,
	subsets: undefined,
	cssVariable: "--font-inter",
};

function makeHarness(
	overrides: {
		isAgent?: boolean;
		args?: Partial<typeof DEFAULT_ARGS>;
		fontsManager?: FakeFontsManager;
		confirm?: FakeConfirm;
		createFontsManager?: () => Promise<FakeFontsManager>;
	} = {},
) {
	const filesystem = new FakeFilesystem();
	const logger = new FakeLogger();
	const errorHandler = new FakeErrorHandler();
	const confirm = overrides.confirm ?? new FakeConfirm();
	const fontsManager =
		overrides.fontsManager ??
		new FakeFontsManager({
			families: [FAMILY],
			resolve: () => ({ fonts: [RESOLVED_FONT], fallbacks: [] }),
		});
	const intro = { called: 0 };
	const outro = { called: 0 };

	// These should never be reached on a fully-flagged run.
	const autocomplete = new FakeAutocomplete(() => {
		throw new Error("should not prompt for a family");
	});
	const directoryPicker = new FakeDirectoryPicker(() => {
		throw new Error("should not pick a directory");
	});
	const text = new FakeText();
	const multiselect = new FakeMultiselect();

	const options = {
		isAgent: overrides.isAgent ?? false,
		args: { ...DEFAULT_ARGS, ...overrides.args },
		errorHandler,
		createSpinner: () => new FakeSpinner(),
		createAutocomplete: () => autocomplete,
		createMultiselect: () => multiselect,
		createDirectoryPicker: () => directoryPicker,
		createProgress: () => new FakeProgress(),
		createText: () => text,
		logger,
		hasher: new FakeHasher(),
		createFontsManager:
			overrides.createFontsManager ?? (async () => fontsManager),
		createSearch: <T extends Record<string, any>>(items: Array<T>) =>
			new FakeSearch(items),
		createConfirm: () => confirm,
		intro: async () => {
			intro.called++;
		},
		outro: () => {
			outro.called++;
		},
		filesystem,
		fetcher: new FakeFetcher(),
	};

	return {
		options,
		filesystem,
		logger,
		errorHandler,
		confirm,
		fontsManager,
		intro,
		outro,
	};
}

describe("mainImpl", () => {
	test("wires the full flow: download, save fonts, save css, outro", async () => {
		const h = makeHarness();

		await mainImpl(h.options);

		assert.deepEqual(h.errorHandler.errors, []);
		assert.equal(h.intro.called, 1);
		assert.equal(h.outro.called, 1);

		// The chosen family and properties reach the resolver.
		assert.equal(h.fontsManager.resolveCalls.length, 1);
		assert.deepEqual(h.fontsManager.resolveCalls[0].family, FAMILY);
		assert.deepEqual(h.fontsManager.resolveCalls[0].properties.weights, [
			"400",
		]);

		// One font file written into the fonts dir, plus the css file.
		assert.deepEqual(h.filesystem.mkdirs, ["/proj/public/fonts"]);
		const paths = h.filesystem.writes.map((w) => w.path).sort();
		assert.deepEqual(paths, [
			"/proj/public/fonts/font-inter-400-normal.deadbeef.woff2",
			"/proj/src/styles/font-inter.css",
		]);

		assert.ok(h.logger.steps.includes("Saved 1 font file to disk"));
		assert.ok(h.logger.steps.includes("Saved font-inter.css to disk"));
	});

	test("confirms the exact number of files before downloading", async () => {
		const h = makeHarness();

		await mainImpl(h.options);

		assert.deepEqual(h.confirm.calls, [
			"1 file will be downloaded. Do you want to continue?",
		]);
	});

	test("warns and stops early when no fonts match the selection", async () => {
		const h = makeHarness({
			fontsManager: new FakeFontsManager({
				families: [FAMILY],
				resolve: () => ({ fonts: [], fallbacks: undefined }),
			}),
		});

		await mainImpl(h.options);

		assert.deepEqual(h.errorHandler.errors, []);
		assert.ok(
			h.logger.warns.some((w) => w.includes("No fonts could be found")),
		);
		// Bails before confirming, writing, or the outro.
		assert.deepEqual(h.confirm.calls, []);
		assert.deepEqual(h.filesystem.writes, []);
		assert.equal(h.outro.called, 0);
	});

	test("routes a declined confirmation to the error handler as a cancel", async () => {
		const h = makeHarness({ confirm: new FakeConfirm(() => false) });

		await mainImpl(h.options);

		assert.equal(h.errorHandler.errors.length, 1);
		const error = h.errorHandler.errors[0];
		assert.ok(error instanceof ShortCircuit);
		assert.deepEqual(error.data, { type: "cancel" });

		// Nothing is written and the run does not complete.
		assert.deepEqual(h.filesystem.writes, []);
		assert.equal(h.outro.called, 0);
	});

	test("routes a selection short-circuit to the error handler in agent mode", async () => {
		const h = makeHarness({
			isAgent: true,
			args: { publicDir: undefined },
		});

		await mainImpl(h.options);

		assert.equal(h.errorHandler.errors.length, 1);
		const error = h.errorHandler.errors[0];
		assert.ok(error instanceof ShortCircuit);
		assert.deepEqual(error.data, { type: "silent" });
		assert.ok(h.logger.warns.some((w) => w.includes("must be set")));
		assert.equal(h.outro.called, 0);
	});

	test("surfaces unexpected errors through the error handler", async () => {
		const boom = new Error("fonts manager exploded");
		const h = makeHarness({
			createFontsManager: async () => {
				throw boom;
			},
		});

		await mainImpl(h.options);

		assert.deepEqual(h.errorHandler.errors, [boom]);
		assert.equal(h.intro.called, 1);
		assert.equal(h.outro.called, 0);
	});
});
