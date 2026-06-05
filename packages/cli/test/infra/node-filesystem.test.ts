import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { NodeFilesystem } from "../../dist/infra/node-filesystem.js";

describe("NodeFilesystem.isDirectory", () => {
	let dir: string;
	let file: string;

	before(async () => {
		dir = await mkdtemp(join(tmpdir(), "leturgero-fs-"));
		file = join(dir, "not-a-dir.txt");
		await writeFile(file, "x");
	});

	after(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	test("accepts an existing absolute directory", async () => {
		const fs = new NodeFilesystem();
		assert.equal(await fs.isDirectory(dir), undefined);
	});

	test("ignores an undefined path (nothing to validate)", async () => {
		const fs = new NodeFilesystem();
		assert.equal(await fs.isDirectory(undefined), undefined);
	});

	test("rejects a relative path before touching the filesystem", async () => {
		const fs = new NodeFilesystem();
		assert.equal(await fs.isDirectory("fonts"), "Must be an absolute path");
	});

	test("reports a missing absolute path", async () => {
		const fs = new NodeFilesystem();
		assert.equal(
			await fs.isDirectory(join(dir, "does-not-exist")),
			"Path does not exist",
		);
	});

	test("reports an absolute path that is not a directory", async () => {
		const fs = new NodeFilesystem();
		assert.equal(await fs.isDirectory(file), "Not a directory");
	});
});
