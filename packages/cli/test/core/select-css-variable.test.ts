import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	selectCssVariable,
	validateSelectCssVariableArgs,
} from "../../dist/core/select-css-variable.js";
import { assertShortCircuit, FakeLogger, FakeText } from "../helpers.ts";

describe("validateSelectCssVariableArgs", () => {
	test("accepts an undefined value (nothing to validate)", () => {
		const result = validateSelectCssVariableArgs({ cssVariable: undefined });
		assert.deepEqual(result, { cssVariable: undefined });
	});

	test("accepts a valid CSS custom property name", () => {
		const result = validateSelectCssVariableArgs({
			cssVariable: "--font-inter",
		});
		assert.deepEqual(result, { cssVariable: "--font-inter" });
	});

	test("requires a -- prefix", async () => {
		await assertShortCircuit(
			async () => validateSelectCssVariableArgs({ cssVariable: "font" }),
			{ type: "error", error: "Must start with --" },
		);
	});

	test("requires at least one character after the prefix", async () => {
		await assertShortCircuit(
			async () => validateSelectCssVariableArgs({ cssVariable: "--" }),
			{ type: "error", error: "Must at least contain another character" },
		);
	});

	test("rejects invalid ident characters", async () => {
		await assertShortCircuit(
			async () => validateSelectCssVariableArgs({ cssVariable: "--bad var" }),
			{
				type: "error",
				error:
					"Must be valid CSS ident. It can only contain letters, digits, hyphens and underscores",
			},
		);
	});
});

describe("selectCssVariable", () => {
	test("returns the provided arg without prompting", async () => {
		const logger = new FakeLogger();
		const text = new FakeText();

		const result = await selectCssVariable({
			family: "Inter",
			text,
			isAgent: false,
			args: { cssVariable: "--my-font" },
			logger,
		});

		assert.equal(result, "--my-font");
		assert.equal(text.calls.length, 0);
	});

	test("prompts with a kebab-cased suggestion as the initial value", async () => {
		const logger = new FakeLogger();
		const text = new FakeText();

		const result = await selectCssVariable({
			family: "Open Sans",
			text,
			isAgent: false,
			args: { cssVariable: undefined },
			logger,
		});

		assert.equal(text.calls.length, 1);
		assert.equal(text.calls[0].initialValue, "--font-open-sans");
		assert.equal(result, "--font-open-sans");
	});

	test("short-circuits silently in agent mode with a suggestion", async () => {
		const logger = new FakeLogger();
		const text = new FakeText();

		await assertShortCircuit(
			() =>
				selectCssVariable({
					family: "Open Sans",
					text,
					isAgent: true,
					args: { cssVariable: undefined },
					logger,
				}),
			{ type: "silent" },
		);

		assert.ok(logger.warns.some((w) => w.includes("must be set")));
		assert.ok(logger.steps.includes("Suggestion: --font-open-sans"));
	});
});
