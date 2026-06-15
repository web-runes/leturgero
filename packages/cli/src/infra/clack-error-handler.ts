import { outro } from "@clack/prompts";
import { ShortCircuit } from "../core/short-circuit.js";
import type { ErrorHandler } from "../types.js";

export class ClackErrorHandler implements ErrorHandler {
	#outroMessage: string;

	constructor({ outroMessage }: { outroMessage: string }) {
		this.#outroMessage = outroMessage;
	}

	onError(error: unknown): void {
		if (error instanceof ShortCircuit) {
			const { data } = error;
			switch (data.type) {
				case "cancel": {
					outro(this.#outroMessage);
					process.exit(130);
					break;
				}
				case "error": {
					outro(data.error);
					process.exit(1);
					break;
				}
				case "silent": {
					process.exit(0);
					break;
				}
			}
		}

		const message =
			error instanceof Error
				? (error.stack ?? `${error.name}: ${error.message}`)
				: typeof error === "string"
					? error
					: JSON.stringify(error, null, 2);
		outro(`An unexpected error occurred:\n${message}`);
		process.exit(1);
	}
}
