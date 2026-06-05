import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	selectPaths,
	validateSelectPathsArgs,
} from "../../dist/core/select-paths.js";
import {
	assertShortCircuit,
	FakeDirectoryPicker,
	FakeFilesystem,
	FakeLogger,
	FakeText,
} from "../helpers.ts";

const VALID_ARGS = {
	publicDir: "/proj/public",
	publicFontsDir: "fonts",
	stylesDir: "/proj/src/styles",
};

describe("validateSelectPathsArgs", () => {
	test("returns the values when every directory check passes", async () => {
		const filesystem = new FakeFilesystem({ isDirectory: () => undefined });
		const result = await validateSelectPathsArgs(VALID_ARGS, { filesystem });
		assert.deepEqual(result, VALID_ARGS);
	});

	test("short-circuits with the filesystem error for an invalid directory", async () => {
		const filesystem = new FakeFilesystem({
			isDirectory: (path) =>
				path === "/proj/public" ? "Not a directory" : undefined,
		});

		await assertShortCircuit(
			() => validateSelectPathsArgs(VALID_ARGS, { filesystem }),
			{ type: "error", error: "Not a directory" },
		);
	});
});

describe("selectPaths (agent mode)", () => {
	test("short-circuits silently when a path flag is missing", async () => {
		const logger = new FakeLogger();
		const text = new FakeText();
		const directoryPicker = new FakeDirectoryPicker(() => "/x");

		await assertShortCircuit(
			() =>
				selectPaths({
					directoryPicker,
					text,
					root: "/proj",
					isAgent: true,
					args: {
						publicDir: "/proj/public",
						publicFontsDir: undefined,
						stylesDir: undefined,
					},
					logger,
				}),
			{ type: "silent" },
		);
		assert.ok(logger.warns.some((w) => w.includes("must be set")));
	});
});

describe("selectPaths (interactive mode)", () => {
	test("returns provided args without prompting", async () => {
		const logger = new FakeLogger();
		const text = new FakeText();
		const directoryPicker = new FakeDirectoryPicker(() => "/x");

		const result = await selectPaths({
			directoryPicker,
			text,
			root: "/proj",
			isAgent: false,
			args: VALID_ARGS,
			logger,
		});

		assert.deepEqual(result, VALID_ARGS);
		assert.equal(text.calls.length, 0);
		assert.equal(directoryPicker.calls.length, 0);
	});

	test("prompts via the directory picker and text input when args are missing", async () => {
		const logger = new FakeLogger();
		const text = new FakeText(() => "./fonts");
		const directoryPicker = new FakeDirectoryPicker((o) =>
			o.message.includes("static assets") ? "/proj/public" : "/proj/styles",
		);

		const result = await selectPaths({
			directoryPicker,
			text,
			root: "/proj",
			isAgent: false,
			args: {
				publicDir: undefined,
				publicFontsDir: undefined,
				stylesDir: undefined,
			},
			logger,
		});

		assert.deepEqual(result, {
			publicDir: "/proj/public",
			publicFontsDir: "./fonts",
			stylesDir: "/proj/styles",
		});
		assert.equal(directoryPicker.calls.length, 2);
		assert.equal(text.calls.length, 1);
		assert.equal(directoryPicker.calls[0].root, "/proj");
	});
});
