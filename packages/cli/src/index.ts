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

const main = defineCommand({
	meta: {
		name: pkg.name,
		description: pkg.description,
		version: pkg.version,
	},
	args: {},
	async run() {
		clack.intro("Welcome");
		const providers = await clack.multiselect<ValidProviderName>({
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
		});
		if (clack.isCancel(providers)) {
			clack.cancel("Bye");
			return;
		}

		let unifontInstance: unifont.Unifont<
			[unifont.Provider, ...unifont.Provider[]]
		>;
		const listed: Record<string, Array<string>> = {};
		await clack.tasks([
			{
				title: "Initializing font providers",
				task: async () => {
					// TODO: cache?
					unifontInstance = await unifont.createUnifont(
						(providers as Array<ValidProviderName>).map((key) =>
							// TODO: ask for id
							// @ts-expect-error i know
							unifontProviders[key](key === "adobe" ? { id: "" } : undefined),
						) as any,
					);
					return "Initialization completed";
				},
			},
			{
				title: "Listing available fonts",
				task: async (message) => {
					for (const provider of providers as Array<ValidProviderName>) {
						message(`Listing ${provider}`);
						listed[provider] =
							(await unifontInstance.listFonts([provider])) ?? [];
					}
					return "Listing completed";
				},
			},
		]);

		const fuse = new Fuse(
			Object.entries(listed).flatMap(([provider, families]) =>
				families.map((family) => ({ family, provider })),
			),
			{
				keys: ["family"],
				includeScore: true,
			},
		);
		const family = await clack.autocomplete<{
			family: string;
			provider: string;
		}>({
			message: "Search for a family",
			placeholder: "Type to search...",
			maxItems: 10,
			options() {
				const candidates = fuse
					.search(this.userInput)
					.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
				return candidates.map((candidate) => ({
					value: candidate.item,
					label: candidate.item.family,
					hint: providers.length > 1 ? candidate.item.provider : undefined,
				}));
				// const candidates: Array<clack.Option<string> & { label: string }> = [];
				// for (const [provider, families] of Object.entries(listed)) {
				// 	candidates.push(
				// 		...families
				// 			.filter((family) =>
				// 				family.toLowerCase().includes(this.userInput.toLowerCase()),
				// 			)
				// 			.map(
				// 				(value) =>
				// 					({
				// 						value,
				// 						label: value,
				// 						hint: providers.length > 1 ? provider : undefined,
				// 					}) satisfies clack.Option<string>,
				// 			),
				// 	);
				// }
				// return candidates;
			},
		});
		console.log(family);
	},
});

runMain(main);
