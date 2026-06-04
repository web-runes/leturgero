import { type ProgressResult, progress } from "@clack/prompts";
import type { Progress } from "../types.js";

export class ClackProgress implements Progress {
	#progress: ProgressResult;

	constructor({ max }: { max: number }) {
		this.#progress = progress({
			max,
			// https://github.com/bombshell-dev/clack/issues/83
			// onCancel() {
			// 	throw new ShortCircuit({ type: "cancel" });
			// },
		});
	}

	start(msg: string): void {
		this.#progress.start(msg);
	}
	advance(step: number): void {
		this.#progress.advance(step);
	}
	stop(msg: string): void {
		this.#progress.stop(msg);
	}
	error(msg: string): void {
		this.#progress.error(msg);
	}
}
