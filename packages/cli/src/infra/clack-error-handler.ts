import { cancel } from "@clack/prompts";
import type { ErrorHandler } from "../types.js";

export class ClackCancelError extends Error {}

export class ClackErrorHandler implements ErrorHandler {
	#outroMessage: string;

	constructor({ outroMessage }: { outroMessage: string }) {
		this.#outroMessage = outroMessage;
	}

	onError(error: unknown): void {
		if (error instanceof ClackCancelError) {
			cancel(this.#outroMessage);
			process.exit(130);
		}

		const message =
			error instanceof Error
				? (error.stack ?? `${error.name}: ${error.message}`)
				: typeof error === "string"
					? error
					: JSON.stringify(error, null, 2);
		cancel(`An unexpected error occurred:\n${message}`);
		process.exit(1);
	}
}
