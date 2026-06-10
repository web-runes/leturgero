import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	selectProperties,
	validateSelectPropertiesArgs,
} from "../../dist/core/select-properties.js";
import { assertShortCircuit, FakeLogger, FakeMultiselect } from "../helpers.ts";

const EMPTY_ARGS = {
	weights: undefined,
	styles: undefined,
	formats: undefined,
	subsets: undefined,
};

describe("validateSelectPropertiesArgs", () => {
	test("accepts numeric weights and de-duplicates them in order", () => {
		const result = validateSelectPropertiesArgs({
			weights: ["700", "400", "700"],
			styles: undefined,
			formats: undefined,
			subsets: undefined,
		});
		assert.deepEqual(result.weights, ["700", "400"]);
	});

	test("accepts a two-part range weight", () => {
		const result = validateSelectPropertiesArgs({
			weights: ["400 700"],
			styles: undefined,
			formats: undefined,
			subsets: undefined,
		});
		assert.deepEqual(result.weights, ["400 700"]);
	});

	test("rejects a non-numeric weight", () => {
		assert.throws(
			() =>
				validateSelectPropertiesArgs({
					weights: ["heavy"],
					styles: undefined,
					formats: undefined,
					subsets: undefined,
				}),
			/Invalid weights: heavy/,
		);
	});

	test("rejects a range weight with more than two parts", () => {
		assert.throws(
			() =>
				validateSelectPropertiesArgs({
					weights: ["400 700 900"],
					styles: undefined,
					formats: undefined,
					subsets: undefined,
				}),
			/Invalid weights: 400 700 900/,
		);
	});

	test("validates styles against the allowed set", () => {
		const result = validateSelectPropertiesArgs({
			weights: undefined,
			styles: ["normal", "italic"],
			formats: undefined,
			subsets: undefined,
		});
		assert.deepEqual(result.styles, ["normal", "italic"]);

		assert.throws(
			() =>
				validateSelectPropertiesArgs({
					weights: undefined,
					styles: ["slanted"],
					formats: undefined,
					subsets: undefined,
				}),
			/Invalid styles: slanted/,
		);
	});

	test("validates formats against the allowed set", () => {
		assert.throws(
			() =>
				validateSelectPropertiesArgs({
					weights: undefined,
					styles: undefined,
					formats: ["png"],
					subsets: undefined,
				}),
			/Invalid formats: png/,
		);
	});

	test("passes subsets through untouched", () => {
		const result = validateSelectPropertiesArgs({
			weights: undefined,
			styles: undefined,
			formats: undefined,
			subsets: ["latin", "cyrillic"],
		});
		assert.deepEqual(result.subsets, ["latin", "cyrillic"]);
	});

	test("treats an empty array as undefined", () => {
		const result = validateSelectPropertiesArgs({
			weights: [],
			styles: undefined,
			formats: undefined,
			subsets: undefined,
		});
		assert.equal(result.weights, undefined);
	});
});

describe("selectProperties (agent mode)", () => {
	test("warns with defaults and short-circuits silently when flags are missing", async () => {
		const logger = new FakeLogger();
		const multiselect = new FakeMultiselect();

		await assertShortCircuit(
			() =>
				selectProperties({
					suggestions: undefined,
					createMultiselect: () => multiselect,
					logger,
					isAgent: true,
					args: EMPTY_ARGS,
				}),
			{ type: "silent" },
		);

		assert.equal(multiselect.calls.length, 0, "must not prompt in agent mode");
		assert.ok(logger.warns.some((w) => w.includes("must be set")));
		assert.ok(logger.steps.some((s) => s.startsWith("Weights:")));
		assert.ok(logger.steps.some((s) => s.startsWith("Styles:")));
		assert.ok(logger.steps.some((s) => s.startsWith("Formats:")));
		assert.ok(logger.steps.includes("Skipping subsets"));
	});
});

describe("selectProperties (interactive mode)", () => {
	test("prompts with default options and returns the selections", async () => {
		const logger = new FakeLogger();
		const multiselect = new FakeMultiselect();

		const result = await selectProperties({
			suggestions: undefined,
			createMultiselect: () => multiselect,
			logger,
			isAgent: false,
			args: EMPTY_ARGS,
		});

		// weights, styles, formats but not subsets (no suggestions for them).
		assert.equal(multiselect.calls.length, 3);
		assert.deepEqual(result.weights, [
			"100",
			"200",
			"300",
			"400",
			"500",
			"600",
			"700",
			"800",
			"900",
		]);
		assert.deepEqual(result.styles, ["normal", "italic"]);
		assert.deepEqual(result.formats, ["woff2", "woff"]);
		assert.equal(result.subsets, undefined);
		assert.ok(logger.steps.some((s) => s.includes("No subsets are available")));
	});

	test("prompts for subsets when suggestions provide them", async () => {
		const logger = new FakeLogger();
		const multiselect = new FakeMultiselect();

		const result = await selectProperties({
			suggestions: { subsets: ["latin", "greek"] },
			createMultiselect: () => multiselect,
			logger,
			isAgent: false,
			args: EMPTY_ARGS,
		});

		assert.equal(multiselect.calls.length, 4);
		assert.deepEqual(result.subsets, ["latin", "greek"]);
	});

	test("uses provided args instead of prompting", async () => {
		const logger = new FakeLogger();
		const multiselect = new FakeMultiselect();

		const result = await selectProperties({
			suggestions: undefined,
			createMultiselect: () => multiselect,
			logger,
			isAgent: false,
			args: {
				weights: ["400"],
				styles: ["italic"],
				formats: ["woff2"],
				subsets: undefined,
			},
		});

		assert.equal(multiselect.calls.length, 0);
		assert.deepEqual(result, {
			weights: ["400"],
			styles: ["italic"],
			formats: ["woff2"],
			subsets: undefined,
		});
	});
});
