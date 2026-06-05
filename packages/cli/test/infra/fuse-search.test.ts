import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { FuseSearch } from "../../dist/infra/fuse-search.js";

interface Family {
	name: string;
	provider: string;
}

const ITEMS: Array<Family> = [
	{ name: "Inter", provider: "google" },
	{ name: "Open Sans", provider: "google" },
	{ name: "Roboto", provider: "google" },
	{ name: "Roboto Mono", provider: "google" },
];

describe("FuseSearch", () => {
	test("exposes the original items and their total", () => {
		const search = new FuseSearch(ITEMS, ["name"]);
		assert.equal(search.total, 4);
		assert.deepEqual(search.items, ITEMS);
	});

	test("finds close matches via fuzzy search", () => {
		const search = new FuseSearch(ITEMS, ["name"]);
		const results = search.search("rboto");
		assert.ok(results.length > 0);
		assert.ok(results.some((r) => r.name === "Roboto"));
	});

	test("ranks the best match first", () => {
		const search = new FuseSearch(ITEMS, ["name"]);
		const results = search.search("Roboto");
		assert.equal(results[0].name, "Roboto");
	});

	test("returns an empty array when nothing matches", () => {
		const search = new FuseSearch(ITEMS, ["name"]);
		assert.deepEqual(search.search("zzzzzzzz"), []);
	});
});
