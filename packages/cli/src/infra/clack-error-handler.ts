import { cancel } from "@clack/prompts";
import type { ErrorHandler } from "../types.js";

export class ClackCancelError extends Error {}

export class ClackErrorHandler implements ErrorHandler {
	onError(error: unknown): void {
		// TODO: surface unknown errors better
		cancel(
			error instanceof ClackCancelError
				? "Canceled, see you later!"
				: "An unknown error occurred, cancelling",
		);
		process.exit(error instanceof ClackCancelError ? 130 : 1);
	}
}
