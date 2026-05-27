import { createHash } from "node:crypto";
import type { Hasher } from "../types.js";

export class CryptoHasher implements Hasher {
	hash(input: Buffer): string {
		return createHash("shake256", { outputLength: 4 })
			.update(input)
			.digest("hex");
	}
}
