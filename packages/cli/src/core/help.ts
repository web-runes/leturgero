import { type ArgsConstraint, BUILT_IN_ARGS } from "./args.js";

interface Options<T extends ArgsConstraint> {
	name: string;
	args: T;
	/** Description of what the example does, mapped to the command to run. */
	examples: Record<string, string>;
}

const INDENT = "  ";
/** Blank columns between the widest flag and the description column. */
const GAP = 2;

export function renderHelp<T extends ArgsConstraint>(
	options: Options<T>,
): string {
	const flags: Array<[string, string]> = [
		...Object.values(BUILT_IN_ARGS).map(
			({ cliName, short, description }): [string, string] => [
				`-${short}, --${cliName}`,
				description,
			],
		),
		...Object.values(options.args).map(
			({ cliName, description }): [string, string] => [
				`--${cliName} <${cliName}>`,
				description,
			],
		),
	];

	const width = Math.max(...flags.map(([flag]) => flag.length)) + GAP;

	const examples = Object.entries(options.examples).map(
		([description, command]) =>
			`${INDENT}# ${description}\n${INDENT}$ ${command}`,
	);

	return [
		"USAGE:",
		`${INDENT}${options.name} <OPTIONS>`,
		"",
		"OPTIONS:",
		...flags.map(
			([flag, description]) => `${INDENT}${flag.padEnd(width)}${description}`,
		),
		"",
		"EXAMPLES:",
		examples.join("\n\n"),
	].join("\n");
}
