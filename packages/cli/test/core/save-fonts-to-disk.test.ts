import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { saveFontsToDisk } from "../../dist/core/save-fonts-to-disk.js";
import { FakeFilesystem, FakeLogger } from "../helpers.ts";

describe("saveFontsToDisk", () => {
	test("creates the fonts dir and writes every file into it", async () => {
		const filesystem = new FakeFilesystem();
		const logger = new FakeLogger();

		const filenameToContents = new Map<string, Buffer>([
			["inter-400.woff2", Buffer.from("a")],
			["inter-700.woff2", Buffer.from("b")],
		]);

		await saveFontsToDisk({
			filenameToContents,
			filesystem,
			publicDir: "/proj/public",
			publicFontsDir: "fonts",
			logger,
		});

		assert.deepEqual(filesystem.mkdirs, ["/proj/public/fonts"]);
		assert.deepEqual(filesystem.writes.map((w) => w.path).sort(), [
			"/proj/public/fonts/inter-400.woff2",
			"/proj/public/fonts/inter-700.woff2",
		]);
		assert.deepEqual(logger.steps, ["Saved 2 font files to disk"]);
	});

	test("uses the singular noun for a single file", async () => {
		const filesystem = new FakeFilesystem();
		const logger = new FakeLogger();

		await saveFontsToDisk({
			filenameToContents: new Map([["inter-400.woff2", Buffer.from("a")]]),
			filesystem,
			publicDir: "/proj/public",
			publicFontsDir: "fonts",
			logger,
		});

		assert.deepEqual(logger.steps, ["Saved 1 font file to disk"]);
	});
});
