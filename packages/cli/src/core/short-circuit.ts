type ShortCircuitData =
	| { type: "cancel" }
	| { type: "error"; error: string }
	| { type: "silent" };

// TODO: replaces the clack cancel error

export class ShortCircuit {
	readonly data: ShortCircuitData;

	constructor(data: ShortCircuitData) {
		this.data = data;
	}
}
