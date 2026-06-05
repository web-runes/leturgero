import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ShortCircuit } from "../../dist/core/short-circuit.js";

describe("ShortCircuit", () => {
	test("stores cancel data", () => {
		const sc = new ShortCircuit({ type: "cancel" });
		assert.deepEqual(sc.data, { type: "cancel" });
	});

	test("stores error data with a message", () => {
		const sc = new ShortCircuit({ type: "error", error: "boom" });
		assert.deepEqual(sc.data, { type: "error", error: "boom" });
	});

	test("stores silent data", () => {
		const sc = new ShortCircuit({ type: "silent" });
		assert.equal(sc.data.type, "silent");
	});
});
