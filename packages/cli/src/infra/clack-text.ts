import { isCancel, text } from "@clack/prompts";
import { ShortCircuit } from "../core/short-circuit.js";
import type { Text, TextOptions } from "../types.js";

export class ClackText implements Text {
	async run(options: TextOptions): Promise<string> {
		const result = await text({
			message: options.message,
			initialValue: options.initialValue,
			placeholder: options.placeholder,
			validate: options.validate,
		});
		if (isCancel(result)) {
			throw new ShortCircuit({ type: "cancel" });
		}
		return result;
	}
}
