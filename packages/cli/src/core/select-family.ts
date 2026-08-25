import type {
	Autocomplete,
	Logger,
	MinimalFamily,
	Search,
	Select,
	Text,
	TextStyler,
} from "../types.js";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	type InferArgs,
} from "./args.js";
import {
	isUrlLike,
	parseFamilyUrl,
	SUPPORTED_URL_PATTERNS,
	SUPPORTED_URLS_HINT,
} from "./family-url.js";
import { ShortCircuit } from "./short-circuit.js";

const MAX = 10;

export const args = {
	fontFamily: {
		cliName: "font-family",
		type: "string",
		description: `The font family to use, either its name or a Google Fonts, Fontsource or Fontshare URL to extract it from. If the exact provided value cannot be found, up to ${MAX} matches will be returned`,
	},
} as const satisfies ArgsConstraint;

interface Options {
	autocomplete: Autocomplete;
	select: Select;
	text: Text;
	search: Search<MinimalFamily>;
	isAgent: boolean;
	args: InferArgs<typeof args>;
	logger: Logger;
	textStyler: TextStyler;
}

/**
 * Names are compared loosely because URLs carry slugs (`inter-tight`) as often
 * as display names (`Inter Tight`).
 */
function normalize(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findFamily(
	search: Search<MinimalFamily>,
	name: string,
): MinimalFamily | undefined {
	const normalized = normalize(name);
	return search.items.find((e) => normalize(e.name) === normalized);
}

/** Resolves a pasted URL into a family, or explains why it cannot be. */
function resolveUrl(
	search: Search<MinimalFamily>,
	input: string,
): { family: MinimalFamily } | { error: string } {
	const name = parseFamilyUrl(input);
	if (!name) {
		return {
			error: `No font family could be extracted from this URL. ${SUPPORTED_URLS_HINT}`,
		};
	}
	const family = findFamily(search, name);
	if (!family) {
		return { error: `"${name}" is not available from Fontsource or Fontshare` };
	}
	return { family };
}

export async function selectFamily(options: Options): Promise<MinimalFamily> {
	if (options.isAgent && !options.args.fontFamily) {
		options.logger.warn(argsToHelpMessage(args));
		throw new ShortCircuit({ type: "silent" });
	}

	if (options.args.fontFamily) {
		// The flag accepts a URL too, in which case the family name it points at
		// is what gets matched against the available families.
		if (isUrlLike(options.args.fontFamily)) {
			const result = resolveUrl(options.search, options.args.fontFamily);
			if ("error" in result) {
				options.logger.warn(
					`${result.error}. Retry with a valid font family name or URL`,
				);
				throw new ShortCircuit({ type: "silent" });
			}
			return result.family;
		}

		const exact = findFamily(options.search, options.args.fontFamily);
		if (exact) return exact;

		const items = options.search.search(options.args.fontFamily).slice(0, MAX);
		options.logger.warn(
			`No exact match found for --${args.fontFamily.cliName}. Retry with a valid font family name`,
		);
		options.logger.step(
			`Available families (top ${MAX} matches): ${items.map((e) => e.name).join(", ")}`,
		);
		throw new ShortCircuit({ type: "silent" });
	}

	options.logger.step(
		`${options.search.total} fonts from Fontsource (${options.textStyler.blue("https://fontsource.org")}) and Fontshare (${options.textStyler.blue("https://fontshare.com")}) ${options.search.total === 1 ? "is" : "are"} available`,
	);

	const source = await options.select.run<"name" | "url">({
		message: "How would you like to pick a font family?",
		options: [
			{ value: "name", label: "Search by name" },
			{
				value: "url",
				label: "Paste a URL",
				hint: "Google Fonts, Fontsource or Fontshare",
			},
		],
	});

	if (source === "url") {
		const input = await options.text.run({
			message: "What is the URL of the font family you would like to use?",
			placeholder: SUPPORTED_URL_PATTERNS.join(", "),
			validate(value) {
				if (!value) return "Please enter a value";
				const result = resolveUrl(options.search, value);
				return "error" in result ? result.error : undefined;
			},
		});

		const result = resolveUrl(options.search, input);
		// Validation above rejects anything unresolvable, so this only guards
		// against picking a wrong family if it were ever skipped.
		if ("error" in result) {
			throw new ShortCircuit({ type: "error", error: result.error });
		}
		options.logger.step(`Using ${result.family.name}`);
		return result.family;
	}

	return await options.autocomplete.run({
		message: "What font family would you like to use?",
		onSearch(input) {
			return options.search.search(input).map((value) => ({
				value,
				label: value.name,
			}));
		},
	});
}
