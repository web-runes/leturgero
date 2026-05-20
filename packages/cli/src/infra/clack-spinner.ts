import { type SpinnerResult, spinner } from "@clack/prompts";
import type { Spinner } from "../types.js";
import { ClackCancelError } from "./clack-error-handler.js";

export class ClackSpinner implements Spinner {
	#spinner: SpinnerResult;

	constructor() {
		this.#spinner = spinner({
			onCancel() {
				// TODO: does not work
				throw new ClackCancelError();
			},
		});
	}

	start(msg: string): void {
		this.#spinner.start(msg);
	}
	stop(msg: string): void {
		this.#spinner.stop(msg);
	}
}
