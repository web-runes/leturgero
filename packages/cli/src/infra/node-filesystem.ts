import { lstat, mkdir, writeFile } from "node:fs/promises";
import type { Filesystem } from "../types.js";

export class NodeFilesystem implements Filesystem {
	async mkdir(path: string): Promise<void> {
		await mkdir(path, { recursive: true });
	}

	async writeFile(path: string, contents: Buffer): Promise<void> {
		await writeFile(path, contents);
	}

	async isDirectory(path: string | undefined): Promise<string | undefined> {
		if (!path) return;
		try {
			const stats = await lstat(path);
			if (!stats.isDirectory()) {
				return "Not a directory";
			}
		} catch {
			return "Path does not exist";
		}
	}
}
