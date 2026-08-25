import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { selectFamily } from "../../dist/core/select-family.js";
import type { MinimalFamily } from "../../dist/types.js";
import {
	assertShortCircuit,
	FakeAutocomplete,
	FakeLogger,
	FakeSearch,
	FakeSelect,
	FakeText,
	FakeTextStyler,
} from "../helpers.ts";

const ITEMS: Array<MinimalFamily> = [
	{ name: "Inter", provider: "google" },
	{ name: "Open Sans", provider: "google" },
	{ name: "Roboto", provider: "google" },
];

describe("selectFamily", () => {
	test("returns an exact match regardless of case", async () => {
		const logger = new FakeLogger();
		const autocomplete = new FakeAutocomplete(() => {
			throw new Error("should not prompt");
		});

		const result = await selectFamily({
			autocomplete,
			select: new FakeSelect(),
			text: new FakeText(),
			search: new FakeSearch(ITEMS),
			isAgent: false,
			args: { fontFamily: "open sans" },
			logger,
			textStyler: new FakeTextStyler(),
		});

		assert.deepEqual(result, { name: "Open Sans", provider: "google" });
		assert.equal(autocomplete.calls.length, 0);
	});

	test("short-circuits with the top matches when there is no exact match", async () => {
		const logger = new FakeLogger();
		const autocomplete = new FakeAutocomplete(() => ITEMS[0]);

		await assertShortCircuit(
			() =>
				selectFamily({
					autocomplete,
					select: new FakeSelect(),
					text: new FakeText(),
					search: new FakeSearch(ITEMS, [ITEMS[0], ITEMS[2]]),
					isAgent: false,
					args: { fontFamily: "intr" },
					logger,
					textStyler: new FakeTextStyler(),
				}),
			{ type: "silent" },
		);

		assert.ok(logger.warns.some((w) => w.includes("No exact match")));
		assert.ok(logger.steps.some((s) => s.includes("Inter, Roboto")));
	});

	test("short-circuits silently in agent mode when no family is given", async () => {
		const logger = new FakeLogger();
		const autocomplete = new FakeAutocomplete(() => ITEMS[0]);

		await assertShortCircuit(
			() =>
				selectFamily({
					autocomplete,
					select: new FakeSelect(),
					text: new FakeText(),
					search: new FakeSearch(ITEMS),
					isAgent: true,
					args: { fontFamily: undefined },
					logger,
					textStyler: new FakeTextStyler(),
				}),
			{ type: "silent" },
		);
		assert.ok(logger.warns.some((w) => w.includes("must be set")));
	});

	test("falls back to the autocomplete prompt interactively", async () => {
		const logger = new FakeLogger();
		const autocomplete = new FakeAutocomplete(() => ITEMS[1]);

		const result = await selectFamily({
			autocomplete,
			select: new FakeSelect(),
			text: new FakeText(),
			search: new FakeSearch(ITEMS),
			isAgent: false,
			args: { fontFamily: undefined },
			logger,
			textStyler: new FakeTextStyler(),
		});

		assert.deepEqual(result, ITEMS[1]);
		assert.equal(autocomplete.calls.length, 1);
		assert.ok(
			logger.steps.some((s) => s.includes("3 ") && s.includes("are available")),
		);
	});

	test("uses singular phrasing when only one family is available", async () => {
		const logger = new FakeLogger();
		const onlyOne = [ITEMS[0]];
		const autocomplete = new FakeAutocomplete(() => onlyOne[0]);

		await selectFamily({
			autocomplete,
			select: new FakeSelect(),
			text: new FakeText(),
			search: new FakeSearch(onlyOne),
			isAgent: false,
			args: { fontFamily: undefined },
			logger,
			textStyler: new FakeTextStyler(),
		});

		assert.ok(
			logger.steps.some((s) => s.includes("1 ") && s.includes("is available")),
		);
	});
	test("resolves a family from a URL passed as a flag", async () => {
		const logger = new FakeLogger();
		const autocomplete = new FakeAutocomplete(() => {
			throw new Error("should not prompt");
		});

		const result = await selectFamily({
			autocomplete,
			select: new FakeSelect(),
			text: new FakeText(),
			search: new FakeSearch(ITEMS),
			isAgent: false,
			args: { fontFamily: "https://fontsource.org/fonts/open-sans" },
			logger,
			textStyler: new FakeTextStyler(),
		});

		assert.deepEqual(result, { name: "Open Sans", provider: "google" });
	});

	test("short-circuits when a flag URL comes from an unsupported host", async () => {
		const logger = new FakeLogger();
		const autocomplete = new FakeAutocomplete(() => ITEMS[0]);

		await assertShortCircuit(
			() =>
				selectFamily({
					autocomplete,
					select: new FakeSelect(),
					text: new FakeText(),
					search: new FakeSearch(ITEMS),
					isAgent: false,
					args: { fontFamily: "https://example.com/fonts/open-sans" },
					logger,
					textStyler: new FakeTextStyler(),
				}),
			{ type: "silent" },
		);

		assert.ok(logger.warns.some((w) => w.includes("Only Google Fonts")));
	});

	test("short-circuits when a flag URL points at an unavailable family", async () => {
		const logger = new FakeLogger();
		const autocomplete = new FakeAutocomplete(() => ITEMS[0]);

		await assertShortCircuit(
			() =>
				selectFamily({
					autocomplete,
					select: new FakeSelect(),
					text: new FakeText(),
					search: new FakeSearch(ITEMS),
					isAgent: false,
					args: {
						fontFamily: "https://fonts.google.com/specimen/Comic+Neue",
					},
					logger,
					textStyler: new FakeTextStyler(),
				}),
			{ type: "silent" },
		);

		assert.ok(
			logger.warns.some((w) =>
				w.includes('"Comic Neue" is not available from Fontsource'),
			),
		);
	});

	test("prompts for a URL when picked in the switch", async () => {
		const logger = new FakeLogger();
		const autocomplete = new FakeAutocomplete(() => {
			throw new Error("should not prompt for a name");
		});
		const select = new FakeSelect(
			(options) =>
				options.options.find((o) => o.value === "url")?.value ?? "name",
		);
		const text = new FakeText(() => "fontsource.org/fonts/open-sans/install");

		const result = await selectFamily({
			autocomplete,
			select,
			text,
			search: new FakeSearch(ITEMS),
			isAgent: false,
			args: { fontFamily: undefined },
			logger,
			textStyler: new FakeTextStyler(),
		});

		assert.deepEqual(result, { name: "Open Sans", provider: "google" });
		assert.equal(select.calls.length, 1);
		assert.equal(autocomplete.calls.length, 0);
		assert.ok(logger.steps.some((s) => s.includes("Using Open Sans")));

		const placeholder = text.calls[0].placeholder;
		assert.ok(placeholder?.includes("fonts.google.com"));
		assert.ok(placeholder?.includes("fontsource.org"));
		assert.ok(placeholder?.includes("fontshare.com"));
	});

	test("rejects unusable URLs from the prompt before accepting them", async () => {
		const logger = new FakeLogger();
		const select = new FakeSelect(() => "url");
		const text = new FakeText(() => "https://fonts.google.com/specimen/Inter");

		await selectFamily({
			autocomplete: new FakeAutocomplete(() => ITEMS[0]),
			select,
			text,
			search: new FakeSearch(ITEMS),
			isAgent: false,
			args: { fontFamily: undefined },
			logger,
			textStyler: new FakeTextStyler(),
		});

		const validate = text.calls[0].validate;
		assert.ok(validate);
		assert.ok(validate("")?.includes("Please enter a value"));
		assert.ok(validate("https://example.com/inter")?.includes("Only Google"));
		assert.ok(
			validate("https://fontsource.org/fonts/comic-neue")?.includes(
				"not available",
			),
		);
		assert.equal(validate("https://fontsource.org/fonts/inter"), undefined);
	});
});
