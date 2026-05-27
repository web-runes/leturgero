import { log } from "@clack/prompts";
import type { Logger } from "../types.js";

export class ClackLogger implements Logger {
	step(msg: string): void {
		log.step(msg);
	}

	warn(msg: string): void {
		log.warn(msg);
	}
}
