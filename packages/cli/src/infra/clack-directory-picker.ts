import { isCancel, path } from "@clack/prompts";
import type { DirectoryPicker, DirectoryPickerOptions } from "../types.js";
import { ClackCancelError } from "./clack-error-handler.js";

export class ClackDirectoryPicker implements DirectoryPicker {
	async pick(options: DirectoryPickerOptions): Promise<string> {
		const result = await path({
			message: options.message,
			root: options.root,
			directory: true,
		});
		if (isCancel(result)) {
			throw new ClackCancelError();
		}
		return result;
	}
}
