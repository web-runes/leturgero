import Fuse from "fuse.js";
import type { Search } from "../types.js";

export class FuseSearch<T extends Record<string, any>> implements Search<T> {
	#fuse: Fuse<T>;
	readonly total: number;
	readonly items: Array<T>;

	constructor(items: Array<T>, keys: Array<keyof T>) {
		this.items = items;
		this.#fuse = new Fuse(items, {
			keys: keys as any,
			includeScore: true,
			threshold: 0.4,
		});
		this.total = items.length;
	}

	search(input: string): Array<T> {
		return this.#fuse
			.search(input)
			.sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
			.map((e) => e.item);
	}
}
