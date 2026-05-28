import { isCancel, text } from "@clack/prompts";
import type { Text, TextOptions } from "../types.js";
import { ClackCancelError } from "./clack-error-handler.js";

export class ClackText implements Text {
	async run(options: TextOptions): Promise<string> {
		const result = await text({
			message: options.message,
			initialValue: options.initialValue,
			validate: options.validate,
		});
		if (isCancel(result)) {
			throw new ClackCancelError();
		}
		return result;
	}
}
