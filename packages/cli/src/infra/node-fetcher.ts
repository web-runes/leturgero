import type { Fetcher } from "../types.js";

export class NodeFetcher implements Fetcher {
	async fetch(url: string): Promise<Buffer> {
		const res = await fetch(url);
		return Buffer.from(await res.arrayBuffer());
	}
}
