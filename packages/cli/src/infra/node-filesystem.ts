import { mkdir } from "node:fs/promises";
import type { Filesystem } from "../types.js";

export class NodeFilesystem implements Filesystem {
	async mkdir(path: string): Promise<void> {
		await mkdir(path, { recursive: true });
	}

	async writeFile(path: string, contents: Buffer): Promise<void> {
		await this.writeFile(path, contents);
	}
}
