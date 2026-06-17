import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	parseOptimizeFallbacks,
	selectOptimizeFallbacks,
} from "../../dist/core/select-optimize-fallbacks.js";
import { assertShortCircuit, FakeConfirm, FakeLogger } from "../helpers.ts";

describe("parseOptimizeFallbacks", () => {
	test("treats `no` (any casing) as disabled", () => {
		assert.equal(parseOptimizeFallbacks("no"), false);
		assert.equal(parseOptimizeFallbacks("  NO "), false);
	});

	test("treats anything else as enabled", () => {
		assert.equal(parseOptimizeFallbacks("yes"), true);
		assert.equal(parseOptimizeFallbacks("true"), true);
	});
});

describe("selectOptimizeFallbacks", () => {
	test("returns the provided arg without prompting", async () => {
		const confirm = new FakeConfirm(() => {
			throw new Error("should not prompt");
		});

		assert.equal(
			await selectOptimizeFallbacks({
				confirm,
				isAgent: false,
				args: { optimizeFallbacks: false },
				logger: new FakeLogger(),
			}),
			false,
		);
		assert.deepEqual(confirm.calls, []);
	});

	test("short-circuits in agent mode when the flag is not set", async () => {
		const logger = new FakeLogger();
		const confirm = new FakeConfirm(() => {
			throw new Error("should not prompt");
		});

		await assertShortCircuit(
			() =>
				selectOptimizeFallbacks({
					confirm,
					isAgent: true,
					args: { optimizeFallbacks: undefined },
					logger,
				}),
			{ type: "silent" },
		);
		assert.deepEqual(confirm.calls, []);
		assert.ok(logger.warns.some((w) => w.includes("--optimize-fallbacks")));
	});

	test("uses the provided flag without short-circuiting in agent mode", async () => {
		const confirm = new FakeConfirm(() => {
			throw new Error("should not prompt");
		});

		assert.equal(
			await selectOptimizeFallbacks({
				confirm,
				isAgent: true,
				args: { optimizeFallbacks: false },
				logger: new FakeLogger(),
			}),
			false,
		);
		assert.deepEqual(confirm.calls, []);
	});

	test("prompts the user when no arg is set in interactive mode", async () => {
		const confirm = new FakeConfirm(() => false);

		assert.equal(
			await selectOptimizeFallbacks({
				confirm,
				isAgent: false,
				args: { optimizeFallbacks: undefined },
				logger: new FakeLogger(),
			}),
			false,
		);
		assert.equal(confirm.calls.length, 1);
	});
});
