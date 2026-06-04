type ShortCircuitData =
	| { type: "cancel" }
	| { type: "error"; error: string }
	| { type: "silent" };

export class ShortCircuit {
	readonly data: ShortCircuitData;

	constructor(data: ShortCircuitData) {
		this.data = data;
	}
}
