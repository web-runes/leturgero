import { type SpinnerResult, spinner } from "@clack/prompts";
import type { Spinner } from "../types.js";

export class ClackSpinner implements Spinner {
	#spinner: SpinnerResult;

	constructor() {
		this.#spinner = spinner({
			// https://github.com/bombshell-dev/clack/issues/83
			// onCancel() {
			// 	throw new ClackCancelError();
			// },
		});
	}

	start(msg: string): void {
		this.#spinner.start(msg);
	}
	stop(msg: string): void {
		this.#spinner.stop(msg);
	}
}
