import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { CryptoHasher } from "../../dist/infra/crypto-hasher.js";

describe("CryptoHasher", () => {
	test("produces a stable 8-character hex digest", () => {
		const hasher = new CryptoHasher();
		const digest = hasher.hash(Buffer.from("leturgero"));
		assert.equal(digest, "5023ffeb");
		assert.match(digest, /^[0-9a-f]{8}$/);
	});

	test("is deterministic for identical input", () => {
		const hasher = new CryptoHasher();
		assert.equal(
			hasher.hash(Buffer.from("same")),
			hasher.hash(Buffer.from("same")),
		);
	});

	test("differs for different input", () => {
		const hasher = new CryptoHasher();
		assert.notEqual(
			hasher.hash(Buffer.from("a")),
			hasher.hash(Buffer.from("b")),
		);
	});
});
