import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { selectFamily } from "../../dist/core/select-family.js";
import type { MinimalFamily } from "../../dist/types.js";
import {
	assertShortCircuit,
	FakeAutocomplete,
	FakeLogger,
	FakeSearch,
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
});
