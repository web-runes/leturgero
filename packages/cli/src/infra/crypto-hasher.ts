import { createHash } from "node:crypto";
import type { Hasher } from "../types.js";

export class CryptoHasher implements Hasher {
	hash(input: ArrayBuffer): string {
		return createHash("shake256", { outputLength: 4 })
			.update(Buffer.from(input))
			.digest("hex");
	}
}
