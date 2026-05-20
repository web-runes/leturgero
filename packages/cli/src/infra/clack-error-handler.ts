import { cancel } from "@clack/prompts";
import type { ErrorHandler } from "../types.js";

export class ClackCancelError extends Error {}

export class ClackErrorHandler implements ErrorHandler {
	onError(error: unknown): void {
		cancel(
			error instanceof ClackCancelError
				? "Canceled, see you later!"
				: "An unknown error occurred, cancelling",
		);
		process.exit(Number(error instanceof ClackCancelError));
	}
}
