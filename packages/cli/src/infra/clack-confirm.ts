import { confirm, isCancel } from "@clack/prompts";
import { ShortCircuit } from "../core/short-circuit.js";
import type { Confirm } from "../types.js";

export class ClackConfirm implements Confirm {
	#force: boolean;

	constructor({ force }: { force: boolean }) {
		this.#force = force;
	}

	async run(message: string): Promise<boolean> {
		if (this.#force) return true;

		const result = await confirm({
			message,
		});

		if (isCancel(result)) {
			throw new ShortCircuit({ type: "cancel" });
		}

		return result;
	}
}
