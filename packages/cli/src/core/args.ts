import { type ParseArgsOptionsConfig, parseArgs } from "node:util";

interface ArgConstraint {
	cliName: string;
	type: "string" | "custom";
	description: string;
	parse?: (value: string) => any;
}

export type ArgsConstraint = Record<string, ArgConstraint>;

export type InferArgs<T extends ArgsConstraint> = {
	[K in keyof T]:
		| ("parse" extends keyof T[K]
				? ReturnType<NonNullable<T[K]["parse"]>>
				: string)
		| undefined;
};

/** Flags handled by the CLI itself rather than by the command. */
export const BUILT_IN_ARGS = {
	help: {
		cliName: "help",
		short: "h",
		description: "Display this help message",
	},
	version: {
		cliName: "version",
		short: "v",
		description: "Display this version",
	},
} as const;

/** Thrown when `argv` cannot be parsed, so callers can report it cleanly. */
export class CliArgsError extends Error {}

export interface ParsedCli<T extends ArgsConstraint> {
	values: InferArgs<T>;
	help: boolean;
	version: boolean;
}

/**
 * Whether a token is one of the declared flags, in either the `--flag` or the
 * `--flag=value` form. Short flags may be bundled, e.g. `-hv`.
 */
function isKnownFlag(token: string, options: ParseArgsOptionsConfig): boolean {
	if (token === "-" || !token.startsWith("-")) return false;
	const [name] = token.split("=", 1);
	if (name.startsWith("--")) return name.slice(2) in options;
	const shorts = new Set(
		Object.values(options)
			.map(({ short }) => short)
			.filter((short) => short !== undefined),
	);
	return [...name.slice(1)].every((char) => shorts.has(char));
}

/**
 * `parseArgs` rejects a dash-leading value in the `--flag value` form, yet
 * `--css-variable --font-inter` is a legitimate invocation. Rewrite such pairs
 * to `--flag=value`, leaving alone the ones whose value is itself a declared
 * flag so that a genuinely missing value is still reported.
 */
function joinDashLeadingValues(
	argv: Array<string>,
	options: ParseArgsOptionsConfig,
): Array<string> {
	const takesValue = new Set(
		Object.entries(options)
			.filter(([, { type }]) => type === "string")
			.map(([name]) => `--${name}`),
	);

	const result: Array<string> = [];
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		// Everything past the terminator is left for parseArgs to reject.
		if (token === "--") {
			result.push(...argv.slice(i));
			break;
		}
		const value = argv[i + 1];
		if (
			takesValue.has(token) &&
			value !== undefined &&
			value !== "-" &&
			value.startsWith("-") &&
			!isKnownFlag(value, options)
		) {
			result.push(`${token}=${value}`);
			i++;
			continue;
		}
		result.push(token);
	}

	return result;
}

/**
 * Parses `argv` with `node:util`'s `parseArgs`. Every flag is a string on the
 * command line; `parse` turns the ones declared as `custom` into their final
 * shape, and the result is keyed by the internal names rather than the CLI ones.
 */
export function parseCliArgs<T extends ArgsConstraint>(
	args: T,
	argv: Array<string>,
): ParsedCli<T> {
	const options: ParseArgsOptionsConfig = {};
	for (const { cliName, short } of Object.values(BUILT_IN_ARGS)) {
		options[cliName] = { type: "boolean", short };
	}
	for (const { cliName } of Object.values(args)) {
		options[cliName] = { type: "string" };
	}

	let values: Record<
		string,
		string | boolean | Array<string | boolean> | undefined
	>;
	try {
		({ values } = parseArgs({
			args: joinDashLeadingValues(argv, options),
			options,
			strict: true,
			allowPositionals: false,
		}));
	} catch (error) {
		throw new CliArgsError(
			error instanceof Error ? error.message : String(error),
		);
	}

	const normalized: Record<string, unknown> = {};
	for (const [key, arg] of Object.entries(args)) {
		const value = values[arg.cliName];
		if (typeof value !== "string") continue;
		normalized[key] = arg.parse ? arg.parse(value) : value;
	}

	return {
		values: normalized as InferArgs<T>,
		help: values[BUILT_IN_ARGS.help.cliName] === true,
		version: values[BUILT_IN_ARGS.version.cliName] === true,
	};
}

export function argsToHelpMessage<T extends ArgsConstraint>(
	args: T,
	{ optional: _optional = [] }: { optional?: Array<keyof T> } = {},
): string {
	let msg = "Following flags must be set: ";
	const required: Array<string> = [];
	const optional: Array<string> = [];

	for (const [k, v] of Object.entries(args)) {
		if (_optional.includes(k)) {
			optional.push(v.cliName);
		} else {
			required.push(v.cliName);
		}
	}

	msg += required.map((e) => `--${e}`).join(", ");
	if (optional.length > 0) {
		msg += ` (optional: ${optional.map((e) => `--${e}`).join(", ")})`;
	}
	msg +=
		". Ask the user what they want for these flags. Run the command again with --help to know the prerequisites for each. Only add these flags. If you already had flags, keep them";

	return msg;
}

export function parseArray(value: string): Array<string> {
	return value.trim().split(",");
}
