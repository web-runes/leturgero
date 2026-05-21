import type { FontFaceData } from "unifont";

export function extractSources(fonts: Array<FontFaceData>): Array<string> {
	const urls = new Set<string>();

	for (const font of fonts) {
		for (const src of font.src) {
			if ("name" in src) continue;
			urls.add(src.url);
		}
	}

	return [...urls];
}
