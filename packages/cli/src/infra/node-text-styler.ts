import { styleText } from "node:util";
import type { TextStyler } from "../types.js";

export class NodeTextStyler implements TextStyler {
	blue(msg: string): string {
		return styleText("blue", msg);
	}

	green(msg: string): string {
		return styleText("green", msg);
	}

	bgGreen(msg: string): string {
		return styleText("bgGreen", msg);
	}
}
