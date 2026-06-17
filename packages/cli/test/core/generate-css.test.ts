import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateCss } from "../../dist/core/generate-css.js";

describe("generateCss", () => {
	test("renders the :root variable with the family first, then fallbacks", () => {
		const css = generateCss({
			family: "Inter",
			cssVariable: "--font-inter",
			fallbacks: ["Arial", "sans-serif"],
			fonts: [],
		});
		assert.equal(css, ":root {\n  --font-inter: Inter, Arial, sans-serif;\n}");
	});

	test("quotes family and fallback values that contain spaces", () => {
		const css = generateCss({
			family: "Open Sans",
			cssVariable: "--font",
			fallbacks: ["Helvetica Neue"],
			fonts: [],
		});
		assert.ok(css.includes(`--font: "Open Sans", "Helvetica Neue";`), css);
	});

	test("renders a @font-face block with family, src, and defaults", () => {
		const css = generateCss({
			family: "Open Sans",
			cssVariable: "--font",
			fallbacks: [],
			fonts: [
				{
					src: [
						{ url: "https://cdn.example/inter.woff2", format: "woff2" },
						{ name: "Inter" },
					],
					weight: [400, 700],
					style: "italic",
					unicodeRange: ["U+0000-00FF", "U+0131"],
					family: undefined,
					descriptors: undefined,
				},
			],
		});

		assert.ok(css.includes("@font-face {"));
		assert.ok(css.includes(`  font-family: "Open Sans";`), css);
		assert.ok(
			css.includes(
				`  src: url("https://cdn.example/inter.woff2") format("woff2"), local("Inter");`,
			),
			css,
		);
		// font-display defaults to swap when not provided.
		assert.ok(css.includes("  font-display: swap;"), css);
		assert.ok(css.includes("  unicode-range: U+0000-00FF,U+0131;"), css);
		assert.ok(css.includes("  font-weight: 400 700;"), css);
		assert.ok(css.includes("  font-style: italic;"), css);
	});

	test("honours an explicit font-display", () => {
		const css = generateCss({
			family: "Inter",
			cssVariable: "--font",
			fallbacks: [],
			fonts: [
				{
					src: [{ name: "Inter" }],
					display: "optional",
					family: undefined,
					descriptors: undefined,
				},
			],
		});
		assert.ok(css.includes("  font-display: optional;"), css);
		assert.ok(!css.includes("font-display: swap;"), css);
	});

	test("renders a scalar weight via toString and omits empty properties", () => {
		const css = generateCss({
			family: "Inter",
			cssVariable: "--font",
			fallbacks: [],
			fonts: [
				{
					src: [{ name: "Inter" }],
					weight: 500,
					family: undefined,
					descriptors: undefined,
				},
			],
		});
		assert.ok(css.includes("  font-weight: 500;"), css);
		// stretch / feature-settings were never set, so they must not appear.
		assert.ok(!css.includes("font-stretch"), css);
		assert.ok(!css.includes("font-feature-settings"), css);
		assert.ok(!css.includes("unicode-range"), css);
	});

	test("renders url sources with format and tech descriptors", () => {
		const css = generateCss({
			family: "Inter",
			cssVariable: "--font",
			fallbacks: [],
			fonts: [
				{
					src: [
						{
							url: "https://cdn.example/inter.woff2",
							format: "woff2",
							tech: "color-COLRv1",
						},
					],
					family: undefined,
					descriptors: undefined,
				},
			],
		});
		assert.ok(
			css.includes(
				`  src: url("https://cdn.example/inter.woff2") format("woff2") tech(color-COLRv1);`,
			),
			css,
		);
	});

	test("renders a font face under its own family with extra descriptors", () => {
		const css = generateCss({
			family: "Inter",
			cssVariable: "--font-inter",
			fallbacks: ["sans-serif"],
			fonts: [
				{
					family: "Inter fallback: Arial",
					src: [{ name: "Arial" }],
					weight: 400,
					descriptors: { "size-adjust": "90%", "ascent-override": "95%" },
				},
			],
		});
		assert.ok(css.includes('  font-family: "Inter fallback: Arial";'), css);
		assert.ok(css.includes('  src: local("Arial");'), css);
		assert.ok(css.includes("  size-adjust: 90%;"), css);
		assert.ok(css.includes("  ascent-override: 95%;"), css);
	});

	test("separates the variable block and each font-face with a blank line", () => {
		const css = generateCss({
			family: "Inter",
			cssVariable: "--font",
			fallbacks: [],
			fonts: [
				{ src: [{ name: "A" }], family: undefined, descriptors: undefined },
				{ src: [{ name: "B" }], family: undefined, descriptors: undefined },
			],
		});
		const blocks = css.split("\n\n");
		assert.equal(blocks.length, 3);
		assert.ok(blocks[0].startsWith(":root"));
		assert.ok(blocks[1].startsWith("@font-face"));
		assert.ok(blocks[2].startsWith("@font-face"));
	});
});
