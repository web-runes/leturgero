import { isCancel, multiselect } from "@clack/prompts";
import type { Multiselect, MultiselectOptions } from "../types.js";
import { ClackCancelError } from "./clack-error-handler.js";

export class ClackMultiselect implements Multiselect {
	async run<T>(options: MultiselectOptions<T>): Promise<Array<T>> {
		const result = await multiselect<T>({
			message: options.message,
			options: options.options,
			maxItems: 10,
		});
		if (isCancel(result)) {
			throw new ClackCancelError();
		}
		return result;
	}
}
