import { isCancel, path } from "@clack/prompts";
import { ShortCircuit } from "../core/short-circuit.js";
import type { DirectoryPicker, DirectoryPickerOptions } from "../types.js";

export class ClackDirectoryPicker implements DirectoryPicker {
	async pick(options: DirectoryPickerOptions): Promise<string> {
		const root = options.root.endsWith("/") ? options.root : `${options.root}/`;
		const result = await path({
			message: options.message,
			root,
			directory: true,
		});
		if (isCancel(result)) {
			throw new ShortCircuit({ type: "cancel" });
		}
		return result;
	}
}
