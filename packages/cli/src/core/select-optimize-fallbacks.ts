import type { Confirm, Logger } from "../types.js";
import {
	type ArgsConstraint,
	argsToHelpMessage,
	type InferArgs,
} from "./args.js";
import { ShortCircuit } from "./short-circuit.js";

/** Parse a `yes`/`no` flag value into a boolean. Only `no` disables it. */
export function parseOptimizeFallbacks(value: string): boolean {
	return value.trim().toLowerCase() !== "no";
}

export const args = {
	optimizeFallbacks: {
		cliName: "optimize-fallbacks",
		type: "custom",
		description:
			"Whether to generate optimized fallbacks (yes/no) to reduce layout shift while fonts load. Enabled by default; pass no to disable",
		parse: parseOptimizeFallbacks,
	},
} as const satisfies ArgsConstraint;

interface Options {
	confirm: Confirm;
	isAgent: boolean;
	args: InferArgs<typeof args>;
	logger: Logger;
}

export async function selectOptimizeFallbacks(
	options: Options,
): Promise<boolean> {
	if (options.args.optimizeFallbacks !== undefined) {
		return options.args.optimizeFallbacks;
	}

	// The opt-out prompt is offered to interactive users only. An agent must
	// state its choice explicitly via the flag, so we surface it and stop here.
	if (options.isAgent) {
		options.logger.warn(argsToHelpMessage(args));
		options.logger.step("Suggestion: yes");
		throw new ShortCircuit({ type: "silent" });
	}

	return await options.confirm.run(
		"Would you like to generate optimized fallbacks? They reduce layout shift while fonts load.",
	);
}
