import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isUrlLike, parseFamilyUrl } from "../../dist/core/family-url.js";

describe("parseFamilyUrl", () => {
	test("extracts the family from Google Fonts URLs", () => {
		assert.equal(
			parseFamilyUrl("https://fonts.google.com/specimen/Inter+Tight"),
			"Inter Tight",
		);
		assert.equal(
			parseFamilyUrl(
				"https://fonts.google.com/specimen/Roboto/tester?query=rob",
			),
			"Roboto",
		);
		assert.equal(
			parseFamilyUrl(
				"https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400..700&display=swap",
			),
			"Inter Tight",
		);
	});

	test("extracts the family from Fontsource URLs", () => {
		assert.equal(
			parseFamilyUrl("https://fontsource.org/fonts/inter-tight"),
			"inter-tight",
		);
		assert.equal(
			parseFamilyUrl("https://fontsource.org/fonts/inter-tight/install"),
			"inter-tight",
		);
	});

	test("extracts the family from Fontshare URLs", () => {
		assert.equal(
			parseFamilyUrl("https://www.fontshare.com/fonts/general-sans"),
			"general-sans",
		);
		assert.equal(
			parseFamilyUrl("https://api.fontshare.com/v2/css?f[]=general-sans@400"),
			"general-sans",
		);
	});

	test("accepts URLs without a protocol", () => {
		assert.equal(
			parseFamilyUrl("  fonts.google.com/specimen/Inter  "),
			"Inter",
		);
	});

	test("returns nothing for unsupported or malformed input", () => {
		assert.equal(parseFamilyUrl("https://example.com/fonts/inter"), undefined);
		assert.equal(parseFamilyUrl("https://fontsource.org/"), undefined);
		assert.equal(parseFamilyUrl("https://fonts.google.com/"), undefined);
		assert.equal(
			parseFamilyUrl("https://fonts.googleapis.com/css2"),
			undefined,
		);
		assert.equal(parseFamilyUrl("Inter Tight"), undefined);
		assert.equal(parseFamilyUrl(""), undefined);
		assert.equal(parseFamilyUrl("ftp://fontsource.org/fonts/inter"), undefined);
	});
});

describe("isUrlLike", () => {
	test("recognizes anything with an explicit protocol", () => {
		assert.equal(isUrlLike("https://example.com/fonts/inter"), true);
		assert.equal(isUrlLike("http://fontsource.org/fonts/inter"), true);
	});

	test("recognizes supported hosts without a protocol", () => {
		assert.equal(isUrlLike("fontsource.org/fonts/inter"), true);
		assert.equal(isUrlLike("www.fontshare.com/fonts/general-sans"), true);
	});

	test("does not mistake family names for URLs", () => {
		assert.equal(isUrlLike("Inter"), false);
		assert.equal(isUrlLike("Inter Tight"), false);
		assert.equal(isUrlLike("example.com/fonts/inter"), false);
	});
});
