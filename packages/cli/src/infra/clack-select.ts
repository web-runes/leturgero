import { isCancel, select } from "@clack/prompts";
import { ShortCircuit } from "../core/short-circuit.js";
import type { Select, SelectOptions } from "../types.js";

export class ClackSelect implements Select {
	async run<T>(options: SelectOptions<T>): Promise<T> {
		const result = await select<T>({
			message: options.message,
			options: options.options,
		});
		if (isCancel(result)) {
			throw new ShortCircuit({ type: "cancel" });
		}
		return result;
	}
}
