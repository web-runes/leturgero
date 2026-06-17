import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	parseFallbacks,
	selectFallbacks,
} from "../../dist/core/select-fallbacks.js";
import { FakeLogger, FakeText } from "../helpers.ts";

describe("parseFallbacks", () => {
	test("splits on commas and trims each element", () => {
		assert.deepEqual(parseFallbacks("Arial, sans-serif"), [
			"Arial",
			"sans-serif",
		]);
	});

	test("drops empty entries", () => {
		assert.deepEqual(parseFallbacks("Arial, ,,sans-serif,"), [
			"Arial",
			"sans-serif",
		]);
	});

	test("an empty string yields an empty array", () => {
		assert.deepEqual(parseFallbacks(""), []);
	});

	test("preserves family names that contain spaces", () => {
		assert.deepEqual(parseFallbacks("Times New Roman, serif"), [
			"Times New Roman",
			"serif",
		]);
	});
});

describe("selectFallbacks", () => {
	test("returns the provided arg without prompting", async () => {
		const logger = new FakeLogger();
		const text = new FakeText();

		const result = await selectFallbacks({
			defaultFallbacks: ["serif"],
			text,
			isAgent: false,
			args: { fallbacks: ["Arial", "sans-serif"] },
			logger,
		});

		assert.deepEqual(result, ["Arial", "sans-serif"]);
		assert.equal(text.calls.length, 0);
	});

	test("prompts with the resolved defaults as the initial value", async () => {
		const logger = new FakeLogger();
		const text = new FakeText();

		const result = await selectFallbacks({
			defaultFallbacks: ["Arial", "sans-serif"],
			text,
			isAgent: false,
			args: { fallbacks: undefined },
			logger,
		});

		assert.equal(text.calls.length, 1);
		assert.equal(text.calls[0].initialValue, "Arial, sans-serif");
		// FakeText returns the initialValue, which is parsed back into an array.
		assert.deepEqual(result, ["Arial", "sans-serif"]);
	});

	test("parses an edited comma-separated answer", async () => {
		const logger = new FakeLogger();
		const text = new FakeText(() => "Georgia , serif");

		const result = await selectFallbacks({
			defaultFallbacks: ["serif"],
			text,
			isAgent: false,
			args: { fallbacks: undefined },
			logger,
		});

		assert.deepEqual(result, ["Georgia", "serif"]);
	});

	test("uses the resolved defaults without prompting in agent mode", async () => {
		const logger = new FakeLogger();
		const text = new FakeText();

		const result = await selectFallbacks({
			defaultFallbacks: ["Arial", "sans-serif"],
			text,
			isAgent: true,
			args: { fallbacks: undefined },
			logger,
		});

		assert.deepEqual(result, ["Arial", "sans-serif"]);
		assert.equal(text.calls.length, 0);
		assert.ok(logger.warns.some((w) => w.includes("--fallbacks")));
		assert.ok(logger.steps.includes("Fallbacks: Arial, sans-serif"));
	});
});
