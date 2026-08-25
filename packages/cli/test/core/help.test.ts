import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { ArgsConstraint } from "../../dist/core/args.js";
import { renderHelp } from "../../dist/core/help.js";

const constraint = {
	publicDir: {
		cliName: "public-dir",
		type: "string",
		description: "the public dir",
	},
	weights: {
		cliName: "weights",
		type: "custom",
		description: "the weights",
	},
} as const satisfies ArgsConstraint;

const help = renderHelp({
	name: "cli",
	args: constraint,
	examples: { "Using npm": "npx cli", "With a flag": "cli --weights 400" },
});

describe("renderHelp", () => {
	test("documents the built-in flags", () => {
		assert.match(help, /^ {2}-h, --help {2,}Display this help message$/m);
		assert.match(help, /^ {2}-v, --version {2,}Display this version$/m);
	});

	test("documents every declared flag with its value placeholder", () => {
		assert.match(help, /^ {2}--public-dir <public-dir> {2,}the public dir$/m);
		assert.match(help, /^ {2}--weights <weights> {2,}the weights$/m);
	});

	test("aligns descriptions on a single column", () => {
		const columns = help
			.split("\n")
			.filter((line) => line.startsWith("  -"))
			.map((line) => line.indexOf(line.trimStart().split(/ {2,}/)[1]));
		assert.equal(new Set(columns).size, 1);
	});

	test("renders the usage line and the examples", () => {
		assert.ok(help.startsWith("USAGE:\n  cli <OPTIONS>"), help);
		assert.match(help, /EXAMPLES:\n {2}# Using npm\n {2}\$ npx cli/);
		assert.match(help, /\n {2}# With a flag\n {2}\$ cli --weights 400$/);
	});
});
