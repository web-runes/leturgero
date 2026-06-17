import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	fontFaceToProperties,
	handleValueWithSpaces,
	isGenericFontFamily,
	kebabize,
	renderFontFace,
	renderFontSrc,
} from "../dist/utils.js";

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

describe("isGenericFontFamily", () => {
	test("recognizes CSS generic families", () => {
		assert.equal(isGenericFontFamily("sans-serif"), true);
		assert.equal(isGenericFontFamily("serif"), true);
		assert.equal(isGenericFontFamily("system-ui"), true);
	});

	test("rejects concrete family names", () => {
		assert.equal(isGenericFontFamily("Arial"), false);
		assert.equal(isGenericFontFamily("Inter"), false);
	});
});

describe("handleValueWithSpaces", () => {
	test("quotes values containing whitespace", () => {
		assert.equal(handleValueWithSpaces("Open Sans"), '"Open Sans"');
	});

	test("leaves space-free values untouched", () => {
		assert.equal(handleValueWithSpaces("sans-serif"), "sans-serif");
	});
});

describe("renderFontSrc", () => {
	test("renders local and url sources", () => {
		assert.equal(
			renderFontSrc([
				{ url: "/fonts/a.woff2", format: "woff2" },
				{ name: "Inter" },
			]),
			'url("/fonts/a.woff2") format("woff2"), local("Inter")',
		);
	});
});

describe("fontFaceToProperties", () => {
	test("maps font face data to descriptors with a swap default", () => {
		const properties = fontFaceToProperties({
			weight: [400, 700],
			style: "italic",
		});
		assert.equal(properties["font-weight"], "400 700");
		assert.equal(properties["font-style"], "italic");
		assert.equal(properties["font-display"], "swap");
	});
});

describe("renderFontFace", () => {
	test("omits empty descriptors", () => {
		const face = renderFontFace({
			"font-family": "Inter",
			"font-weight": undefined,
		});
		assert.equal(face, "@font-face {\n  font-family: Inter;\n}");
	});
});
