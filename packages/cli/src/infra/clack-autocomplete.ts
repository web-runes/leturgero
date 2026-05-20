import { autocomplete, isCancel } from "@clack/prompts";
import type { Autocomplete, AutocompleteOptions } from "../types.js";
import { ClackCancelError } from "./clack-error-handler.js";

export class ClackAutocomplete implements Autocomplete {
	async run<T>(options: AutocompleteOptions<T>): Promise<T> {
		const result = await autocomplete<T>({
			message: options.message,
			placeholder: "Type to search...",
			maxItems: 10,
			options() {
				return options.onSearch(this.userInput);
			},
		});
		if (isCancel(result)) {
			throw new ClackCancelError();
		}
		return result;
	}
}
