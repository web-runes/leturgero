import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	CliArgsError,
	parseArray,
	parseCliArgs,
} from "../../dist/core/args.js";

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
		parse: parseArray,
	},
} as const satisfies ArgsConstraint;

describe("parseCliArgs", () => {
	test("maps cliName-keyed flags back to the original keys", () => {
		const { values } = parseCliArgs(constraint, [
			"--public-dir",
			"/tmp/public",
			"--weights",
			"400,700",
		]);
		assert.deepEqual(values, {
			publicDir: "/tmp/public",
			weights: ["400", "700"],
		});
	});

	test("only includes flags present in argv", () => {
		const { values } = parseCliArgs(constraint, [
			"--public-dir",
			"/tmp/public",
		]);
		assert.deepEqual(values, { publicDir: "/tmp/public" });
	});

	test("accepts the --flag=value form", () => {
		const { values } = parseCliArgs(constraint, ["--public-dir=/tmp/public"]);
		assert.deepEqual(values, { publicDir: "/tmp/public" });
	});

	test("accepts a dash-leading value", () => {
		const { values } = parseCliArgs(constraint, [
			"--public-dir",
			"--font-inter",
		]);
		assert.deepEqual(values, { publicDir: "--font-inter" });
	});

	test("does not swallow a following flag as a dash-leading value", () => {
		assert.throws(
			() => parseCliArgs(constraint, ["--public-dir", "--weights", "400"]),
			(error: unknown) => error instanceof CliArgsError,
		);
	});

	test("the last occurrence of a repeated flag wins", () => {
		const { values } = parseCliArgs(constraint, [
			"--public-dir",
			"/a",
			"--public-dir",
			"/b",
		]);
		assert.deepEqual(values, { publicDir: "/b" });
	});

	test("reports --help and --version, including their short forms", () => {
		assert.equal(parseCliArgs(constraint, []).help, false);
		assert.equal(parseCliArgs(constraint, []).version, false);
		assert.equal(parseCliArgs(constraint, ["--help"]).help, true);
		assert.equal(parseCliArgs(constraint, ["-h"]).help, true);
		assert.equal(parseCliArgs(constraint, ["--version"]).version, true);
		assert.equal(parseCliArgs(constraint, ["-v"]).version, true);
	});

	test("rejects unknown flags", () => {
		assert.throws(
			() => parseCliArgs(constraint, ["--nope"]),
			(error: unknown) => error instanceof CliArgsError,
		);
	});

	test("rejects positional arguments", () => {
		assert.throws(
			() => parseCliArgs(constraint, ["inter"]),
			(error: unknown) => error instanceof CliArgsError,
		);
	});

	test("rejects a flag missing its value", () => {
		assert.throws(
			() => parseCliArgs(constraint, ["--public-dir"]),
			(error: unknown) => error instanceof CliArgsError,
		);
	});
});

describe("argsToHelpMessage", () => {
	test("lists every flag as required by default", () => {
		const msg = argsToHelpMessage(constraint);
		assert.ok(
			msg.startsWith("Following flags must be set: --public-dir, --weights"),
			msg,
		);
		assert.ok(!msg.includes("optional:"));
	});

	test("splits out optional flags", () => {
		const msg = argsToHelpMessage(constraint, { optional: ["weights"] });
		assert.ok(
			msg.startsWith(
				"Following flags must be set: --public-dir (optional: --weights)",
			),
			msg,
		);
	});
});

describe("parseArray", () => {
	test("splits on commas", () => {
		assert.deepEqual(parseArray("400,700,900"), ["400", "700", "900"]);
	});

	test("trims only the surrounding whitespace, not each element", () => {
		assert.deepEqual(parseArray("  400 , 700  "), ["400 ", " 700"]);
	});

	test("a single value yields a one-element array", () => {
		assert.deepEqual(parseArray("latin"), ["latin"]);
	});
});
