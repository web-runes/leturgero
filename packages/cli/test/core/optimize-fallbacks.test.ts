import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { optimizeFallbacks } from "../../dist/core/optimize-fallbacks.js";
import type { CollectedFont, FontFace } from "../../dist/types.js";
import {
	FakeFontMetricsResolver,
	FakeSystemFallbacksProvider,
} from "../helpers.ts";

function collected(
	data: Partial<FontFace> & Pick<FontFace, "src">,
): CollectedFont {
	return {
		data: { family: undefined, descriptors: undefined, ...data },
		buffer: Buffer.from("font-bytes"),
	};
}

const NORMAL = collected({
	src: [{ name: "Inter" }],
	weight: 400,
	style: "normal",
});

function run(overrides: {
	family?: string;
	fallbacks?: Array<string>;
	collectedFonts?: Array<CollectedFont>;
	systemFallbacksProvider?: FakeSystemFallbacksProvider;
	fontMetricsResolver?: FakeFontMetricsResolver;
}) {
	return optimizeFallbacks({
		family: overrides.family ?? "Inter",
		fallbacks: overrides.fallbacks ?? ["Arial", "sans-serif"],
		collectedFonts: overrides.collectedFonts ?? [NORMAL],
		systemFallbacksProvider:
			overrides.systemFallbacksProvider ?? new FakeSystemFallbacksProvider(),
		fontMetricsResolver:
			overrides.fontMetricsResolver ?? new FakeFontMetricsResolver(),
	});
}

describe("optimizeFallbacks", () => {
	test("returns null when there are no fallbacks", async () => {
		assert.equal(await run({ fallbacks: [] }), null);
	});

	test("returns null when no fonts were collected", async () => {
		assert.equal(await run({ collectedFonts: [] }), null);
	});

	test("returns null when the last fallback is not a generic family", async () => {
		assert.equal(await run({ fallbacks: ["Arial", "Helvetica"] }), null);
	});

	test("returns null when the generic family has no known local fonts", async () => {
		assert.equal(await run({ fallbacks: ["cursive"] }), null);
	});

	test("returns null when the family is itself a system font", async () => {
		assert.equal(await run({ family: "Arial" }), null);
	});

	test("prepends synthetic families and emits one font face each", async () => {
		const resolver = new FakeFontMetricsResolver();
		const result = await run({ fontMetricsResolver: resolver });

		assert.ok(result);
		assert.deepEqual(result.fallbacks, [
			"Inter fallback: Arial",
			"Arial",
			"sans-serif",
		]);
		assert.equal(result.fonts.length, 1);
		const [face] = result.fonts;
		assert.equal(face.family, "Inter fallback: Arial");
		// The source points at the local system font, not the downloaded file.
		assert.deepEqual(face.src, [{ name: "Arial" }]);
		// The variant's descriptors are preserved (weight came from the font).
		assert.equal(face.weight, 400);
		// The computed metric overrides ride along as descriptors.
		assert.deepEqual(face.descriptors, { "size-adjust": "90%" });
		assert.equal(resolver.overrideCalls.length, 1);
	});

	test("derives the bold variant from a font's weight", async () => {
		const provider = new FakeSystemFallbacksProvider((fallback, variant) =>
			fallback === "sans-serif"
				? [variant === "bold" ? "Arial Bold" : "Arial"]
				: null,
		);

		const result = await run({
			collectedFonts: [collected({ src: [{ name: "Inter" }], weight: 700 })],
			systemFallbacksProvider: provider,
		});

		assert.ok(result);
		assert.equal(provider.calls[0].variant, "bold");
		assert.deepEqual(result.fallbacks, [
			"Inter fallback: Arial Bold",
			"Arial",
			"sans-serif",
		]);
	});

	test("unions local fonts across variants, preserving first-seen order", async () => {
		const provider = new FakeSystemFallbacksProvider((fallback, variant) =>
			fallback === "sans-serif"
				? variant === "bold"
					? ["Arial Bold"]
					: ["Arial"]
				: null,
		);

		const result = await run({
			collectedFonts: [
				collected({ src: [{ name: "Inter" }], weight: 400 }),
				collected({ src: [{ name: "Inter" }], weight: 700 }),
			],
			systemFallbacksProvider: provider,
		});

		assert.ok(result);
		assert.deepEqual(result.fallbacks, [
			"Inter fallback: Arial",
			"Inter fallback: Arial Bold",
			"Arial",
			"sans-serif",
		]);
	});
});
