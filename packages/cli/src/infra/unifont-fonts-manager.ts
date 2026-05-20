import { createUnifont, type Provider, providers, type Unifont } from "unifont";
import type { FontsManager, Spinner } from "../types.js";

export class UnifontFontsManager implements FontsManager {
	#unifont!: Unifont<any>;
	#providers!: Array<Provider<any>>;
	#spinner: Spinner;

	constructor({ spinner }: { spinner: Spinner }) {
		this.#spinner = spinner;
	}

	async init(): Promise<void> {
		this.#spinner.start("Initializing...");
		this.#providers = [providers.fontsource(), providers.fontshare()];
		this.#unifont = await createUnifont(this.#providers as any, {});
		this.#spinner.stop("Initialized");
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
