import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { kebabize } from "../dist/utils.js";

describe("kebabize", () => {
	test("lowercases the input", () => {
		assert.equal(kebabize("INTER"), "inter");
	});

	test("replaces runs of whitespace with a single hyphen", () => {
		assert.equal(kebabize("Open Sans"), "open-sans");
		assert.equal(kebabize("Source   Sans  Pro"), "source-sans-pro");
		assert.equal(kebabize("a\tb\nc"), "a-b-c");
	});

	test("leaves hyphenated names untouched", () => {
		assert.equal(kebabize("font-family"), "font-family");
	});

	test("returns an empty string unchanged", () => {
		assert.equal(kebabize(""), "");
	});
});
