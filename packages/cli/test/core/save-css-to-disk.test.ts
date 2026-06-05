import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { saveCssToDisk } from "../../dist/core/save-css-to-disk.js";
import { FakeFilesystem, FakeLogger } from "../helpers.ts";

describe("saveCssToDisk", () => {
	test("writes the css to <stylesDir>/<variable without -->.css", async () => {
		const filesystem = new FakeFilesystem();
		const logger = new FakeLogger();

		await saveCssToDisk({
			cssVariable: "--font-inter",
			css: ":root { --font-inter: Inter; }",
			filesystem,
			stylesDir: "/proj/src/styles",
			logger,
		});

		assert.equal(filesystem.writes.length, 1);
		assert.equal(filesystem.writes[0].path, "/proj/src/styles/font-inter.css");
		assert.deepEqual(
			filesystem.writes[0].contents,
			Buffer.from(":root { --font-inter: Inter; }"),
		);
		assert.deepEqual(logger.steps, ["Saved font-inter.css to disk"]);
	});
});
