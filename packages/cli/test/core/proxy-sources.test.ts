import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { RemoteFontSource } from "unifont";
import { proxySources } from "../../dist/core/proxy-sources.js";
import type { FontFace } from "../../dist/types.js";
import {
	assertShortCircuit,
	FakeFetcher,
	FakeHasher,
	FakeProgress,
} from "../helpers.ts";

function baseOptions(
	overrides: Partial<Parameters<typeof proxySources>[0]> = {},
) {
	const progress = new FakeProgress();
	return {
		cssVariable: "--font-inter",
		fonts: [] as Array<FontFace>,
		hasher: new FakeHasher("abcd1234"),
		publicDir: "/proj/public",
		publicFontsDir: "fonts",
		createProgress: () => progress,
		fetcher: new FakeFetcher(),
		...overrides,
	};
}

describe("proxySources", () => {
	test("downloads remote sources, rewrites urls, and collects file contents", async () => {
		const fonts = [
			{
				src: [
					{ url: "https://cdn.example/inter.woff2", format: "woff2" },
					{ name: "Inter" },
				],
				weight: 400,
				style: "normal",
				family: undefined,
				descriptors: undefined,
			},
		];

		const result = await proxySources(
			baseOptions({
				fonts,
				fetcher: new FakeFetcher(() => Buffer.from("font-bytes")),
			}),
		);

		const expectedFilename = "font-inter-400-normal.abcd1234.woff2";
		assert.deepEqual([...result.filenameToContents.keys()], [expectedFilename]);
		assert.deepEqual(
			result.filenameToContents.get(expectedFilename),
			Buffer.from("font-bytes"),
		);

		const [src0, src1] = result.fonts[0].src;
		assert.deepEqual(src0, {
			url: `/fonts/${expectedFilename}`,
			originalURL: "https://cdn.example/inter.woff2",
			format: "woff2",
			tech: undefined,
		});
		// Local sources are passed through untouched (as a copy).
		assert.deepEqual(src1, { name: "Inter" });
	});

	test("collects each font with the bytes of its first remote source", async () => {
		const fonts = [
			{
				src: [
					{ name: "Inter" },
					{ url: "https://cdn.example/inter.woff2", format: "woff2" },
					{ url: "https://cdn.example/inter.woff", format: "woff" },
				],
				weight: 400,
				style: "normal",
				family: undefined,
				descriptors: undefined,
			},
		];

		const result = await proxySources(
			baseOptions({
				fonts,
				fetcher: new FakeFetcher((url) => Buffer.from(url)),
			}),
		);

		assert.equal(result.collectedFonts.length, 1);
		// The proxied font (with rewritten urls) is what gets collected.
		assert.equal(result.collectedFonts[0].data, result.fonts[0]);
		assert.deepEqual(
			result.collectedFonts[0].buffer,
			Buffer.from("https://cdn.example/inter.woff2"),
		);
	});

	test("does not collect fonts that have no remote source", async () => {
		const fonts = [
			{ src: [{ name: "Inter" }], family: undefined, descriptors: undefined },
		];

		const result = await proxySources(baseOptions({ fonts }));

		assert.deepEqual(result.collectedFonts, []);
	});

	test("derives the format from the file extension when none is given", async () => {
		const fonts = [
			{
				src: [{ url: "https://cdn.example/inter.ttf" } as RemoteFontSource],
				family: undefined,
				descriptors: undefined,
			},
		];

		const result = await proxySources(baseOptions({ fonts }));

		const [filename] = [...result.filenameToContents.keys()];
		assert.ok(filename.endsWith(".ttf"), filename);
		assert.equal(
			(result.fonts[0].src[0] as RemoteFontSource).format,
			"truetype",
		);
	});

	test("reports progress: start, one advance per remote source, then stop", async () => {
		const progress = new FakeProgress();
		const { events } = progress;
		const fonts = [
			{
				src: [
					{ url: "https://cdn.example/a.woff2", format: "woff2" },
					{ name: "Local" },
					{ url: "https://cdn.example/b.woff2", format: "woff2" },
				],
				family: undefined,
				descriptors: undefined,
			},
		];

		await proxySources(baseOptions({ fonts, createProgress: () => progress }));

		assert.deepEqual(events[0], {
			type: "start",
			msg: "Downloading font files...",
		});
		assert.equal(events.filter((e) => e.type === "advance").length, 2);
		assert.deepEqual(events.at(-1), { type: "stop", msg: "Downloaded" });
	});

	test("reports an error and short-circuits with cancel when a fetch fails", async () => {
		const progress = new FakeProgress();
		const { events } = progress;
		const fonts = [
			{
				src: [{ url: "https://cdn.example/a.woff2", format: "woff2" }],
				family: undefined,
				descriptors: undefined,
			},
		];

		await assertShortCircuit(
			() =>
				proxySources(
					baseOptions({
						fonts,
						createProgress: () => progress,
						fetcher: new FakeFetcher(() => {
							throw new Error("network down");
						}),
					}),
				),
			{ type: "cancel" },
		);

		assert.deepEqual(events.at(-1), {
			type: "error",
			msg: "An error occured while downloading, aborting",
		});
	});
});
