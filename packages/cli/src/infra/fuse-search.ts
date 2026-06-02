import Fuse from "fuse.js";
import type { Search, SearchSearchOptions } from "../types.js";

export class FuseSearch<T extends Record<string, any>> implements Search<T> {
	#fuse: Fuse<T>;
	readonly total: number;

	constructor(items: Array<T>, keys: Array<keyof T>) {
		this.#fuse = new Fuse(items, {
			keys: keys as any,
			includeScore: true,
			threshold: 0.4,
		});
		this.total = items.length;
	}

	// TODO: remove exact search in favor of searching the items directly in the consuming code
	search(input: string, { exact = false }: SearchSearchOptions = {}): Array<T> {
		const sorted = this.#fuse
			.search(input)
			.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

		const filtered = exact
			? sorted.filter((e) => e.score && e.score <= 0.0001)
			: sorted;

		return filtered.map((e) => e.item);
	}
}
