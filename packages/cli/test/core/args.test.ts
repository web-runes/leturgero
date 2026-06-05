import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	normalizeGunshiArgs,
	parseArray,
	toGunshiArgs,
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

describe("toGunshiArgs", () => {
	test("keys the output by cliName and carries description/type/parse", () => {
		const gunshi = toGunshiArgs(constraint);
		assert.deepEqual(Object.keys(gunshi).sort(), ["public-dir", "weights"]);
		assert.deepEqual(gunshi["public-dir"], {
			description: "the public dir",
			type: "string",
			parse: undefined,
		});
		assert.equal(gunshi.weights.description, "the weights");
		assert.equal(gunshi.weights.type, "custom");
		assert.equal(gunshi.weights.parse, parseArray);
	});
});

describe("normalizeGunshiArgs", () => {
	test("maps cliName-keyed values back to the original keys", () => {
		const normalized = normalizeGunshiArgs(constraint, {
			"public-dir": "/tmp/public",
			weights: ["400", "700"],
		});
		assert.deepEqual(normalized, {
			publicDir: "/tmp/public",
			weights: ["400", "700"],
		});
	});

	test("only includes keys present in the provided values", () => {
		const normalized = normalizeGunshiArgs(constraint, {
			"public-dir": "/tmp/public",
		});
		assert.deepEqual(normalized, { publicDir: "/tmp/public" });
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
