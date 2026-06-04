import { isCancel, multiselect } from "@clack/prompts";
import { ShortCircuit } from "../core/short-circuit.js";
import type { Multiselect, MultiselectOptions } from "../types.js";

export class ClackMultiselect implements Multiselect {
	async run<T>(options: MultiselectOptions<T>): Promise<Array<T>> {
		const result = await multiselect<T>({
			message: options.message,
			options: options.options,
			maxItems: 10,
			required: true,
		});
		if (isCancel(result)) {
			throw new ShortCircuit({ type: "cancel" });
		}
		return result;
	}
}
