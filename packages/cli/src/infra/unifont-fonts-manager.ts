import { createUnifont, type Provider, providers, type Unifont } from "unifont";
import type { FontsManager } from "../types.js";

export class UnifontFontsManager implements FontsManager {
	#providers: Array<Provider<any>>;
	#unifont: Unifont<any>;

	private constructor({
		providers,
		unifont,
	}: {
		providers: Array<Provider<any>>;
		unifont: Unifont<any>;
	}) {
		this.#providers = providers;
		this.#unifont = unifont;
	}

	static async create(): Promise<UnifontFontsManager> {
		const _providers = [providers.fontsource(), providers.fontshare()];
		return new UnifontFontsManager({
			providers: _providers,
			unifont: await createUnifont(_providers as any, {}),
		});
	}

	async list(): Promise<Array<{ family: string; provider: string }>> {
		const providerByFamily = new Map<string, string>();
		for (const provider of this.#providers) {
			const availableFamilies = await this.#unifont.listFonts([provider._name]);
			if (!availableFamilies) continue;
			for (const family of availableFamilies) {
				if (providerByFamily.has(family)) continue;
				providerByFamily.set(family, provider._name);
			}
		}
		return [...providerByFamily.entries()].map(([family, provider]) => ({
			family,
			provider,
		}));
	}
}
