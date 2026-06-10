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

export function toGunshiArgs<T extends ArgsConstraint>(
	args: T,
): {
	[K in keyof T as T[K]["cliName"]]: {
		description: T[K]["description"];
		type: T[K]["type"];
	} & ("parse" extends keyof T[K]
		? {
				parse: T[K]["parse"];
			}
		: {
				parse?: undefined;
			});
} {
	return Object.fromEntries(
		Object.values(args).map((v) => [
			v.cliName,
			{
				description: v.description,
				type: v.type,
				parse: v.parse,
			},
		]),
	) as any;
}

export function normalizeGunshiArgs<
	T extends ArgsConstraint,
	U extends {
		[K in keyof T as T[K]["cliName"]]?: any;
	},
>(
	args: T,
	values: U,
): {
	[K in keyof T]: U[T[K]["cliName"]];
} {
	const reversed = Object.fromEntries(
		Object.entries(args).map(([k, v]) => [v.cliName, k]),
	);
	return Object.fromEntries(
		Object.entries(values).map(([k, v]) => [reversed[k], v]),
	) as any;
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
