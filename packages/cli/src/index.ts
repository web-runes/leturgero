import * as clack from "@clack/prompts";
import { defineCommand, runMain } from "citty";
import Fuse from "fuse.js";
import * as unifont from "unifont";
import pkg from "../package.json" with { type: "json" };

const unifontProviders = unifont.providers;

type SafeExtract<T, U extends T> = Extract<T, U>;

type ProviderName = keyof typeof unifontProviders;
type ValidProviderName = SafeExtract<
	ProviderName,
	"adobe" | "bunny" | "fontshare" | "fontsource" | "google"
>;

function handleCancel<TValue>(value: symbol | TValue): TValue {
	if (clack.isCancel(value)) {
		clack.cancel("Bye");
		process.exit(0);
	}
	return value;
}

const main = defineCommand({
	meta: {
		name: pkg.name,
		description: pkg.description,
		version: pkg.version,
	},
	args: {},
	async run() {
		clack.intro("Welcome");
		const providers = handleCancel(
			await clack.multiselect<ValidProviderName>({
				message: "Choose which providers to query",
				options: [
					{
						value: "adobe",
						label: "Adobe",
						hint: "Kit ID required",
					},
					{
						value: "bunny",
						label: "Bunny",
					},
					{
						value: "fontshare",
						label: "Fontshare",
					},
					{
						value: "fontsource",
						label: "Fontsource",
					},
					{
						value: "google",
						label: "Google",
					},
				],
				initialValues: ["fontsource"],
			}),
		);

		const initSpinner = clack.spinner();
		initSpinner.start("Initializing font providers...");
		const unifontInstance = await unifont.createUnifont(
			providers.map((key) =>
				// TODO: ask for id
				// @ts-expect-error i know
				unifontProviders[key](key === "adobe" ? { id: "" } : undefined),
			) as any,
		);
		const familyByProvider: Record<string, Array<string>> = {};
		for (const provider of providers) {
			const families = (await unifontInstance.listFonts([provider])) ?? [];
			for (const family of families) {
				if (familyByProvider[family]) {
					familyByProvider[family].push(provider);
				} else {
					familyByProvider[family] = [provider];
				}
			}
		}
		initSpinner.stop("Initialization completed");

		const fuse = new Fuse(
			Object.entries(familyByProvider).map(([family, providers]) => ({
				family,
				providers,
			})),
			{
				keys: ["family"],
				includeScore: true,
			},
		);
		const family = handleCancel(
			await clack.autocomplete<{
				family: string;
				providers: Array<string>;
			}>({
				message: `Search for a family (${Object.keys(familyByProvider).length} available)`,
				placeholder: "Type to search...",
				maxItems: 10,
				options() {
					const candidates = fuse
						.search(this.userInput)
						.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
					return candidates.map((candidate) => ({
						value: candidate.item,
						label: candidate.item.family,
						hint:
							providers.length > 1
								? candidate.item.providers.join(", ")
								: undefined,
					}));
				},
			}),
		);
		console.log(family);
	},
});

runMain(main);
