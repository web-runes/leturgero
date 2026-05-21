import {
	createUnifont,
	type FontFaceData,
	type Provider,
	providers,
	type Unifont,
} from "unifont";
import type {
	FamilyProperties,
	FamilySuggestions,
	FontsManager,
	MinimalFamily,
} from "../types.js";

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

	async list(): Promise<Array<MinimalFamily>> {
		const providerByFamily = new Map<string, string>();
		for (const provider of this.#providers) {
			const availableFamilies = await this.#unifont.listFonts([provider._name]);
			if (!availableFamilies) continue;
			for (const family of availableFamilies) {
				if (providerByFamily.has(family)) continue;
				providerByFamily.set(family, provider._name);
			}
		}
		return [...providerByFamily.entries()].map(([name, provider]) => ({
			name,
			provider,
		}));
	}

	// TODO: https://github.com/unjs/unifont/pull/398
	async getSuggestions(
		_family: MinimalFamily,
	): Promise<FamilySuggestions | undefined> {
		return;
	}

	async resolve(
		family: MinimalFamily,
		properties: FamilyProperties,
	): Promise<{
		fonts: Array<FontFaceData>;
		fallbacks: Array<string> | undefined;
	}> {
		const result = await this.#unifont.resolveFont(family.name, properties, [
			family.provider,
		]);
		return {
			fonts: result.fonts,
			fallbacks: result.fallbacks,
		};
	}
}
