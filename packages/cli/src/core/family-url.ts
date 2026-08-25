/**
 * Font family names can be pasted as a URL instead of being searched for. Only
 * the providers we can resolve fonts from are supported, plus Google Fonts:
 * most of its catalog is mirrored by Fontsource.
 */
const SUPPORTED_HOSTS: Array<string> = [
	"fonts.google.com",
	"fonts.googleapis.com",
	"fontsource.org",
	"fontshare.com",
	"api.fontshare.com",
];

/**
 * The shape of a URL per supported source, shown as the URL prompt's
 * placeholder. Kept short enough to fit an 80 column terminal.
 */
export const SUPPORTED_URL_PATTERNS: Array<string> = [
	"fonts.google.com/specimen/…",
	"fontsource.org/fonts/…",
	"fontshare.com/fonts/…",
];

export const SUPPORTED_URLS_HINT =
	"Only Google Fonts, Fontsource and Fontshare URLs are supported";

function toUrl(input: string): URL | undefined {
	const value = input.trim();
	if (!value) return;
	try {
		// URLs copied from an address bar often lack their protocol.
		const url = new URL(
			/^[a-z][a-z0-9+\-.]*:\/\//i.test(value) ? value : `https://${value}`,
		);
		if (url.protocol !== "http:" && url.protocol !== "https:") return;
		return url;
	} catch {
		return;
	}
}

/** `www.fontshare.com` and `fontshare.com` are the same host to us. */
function getHost(url: URL): string {
	return url.hostname.toLowerCase().replace(/^www\./, "");
}

/** Reads the segment following `keyword` in a path, e.g. `/fonts/<slug>`. */
function segmentAfter(url: URL, keyword: string): string | undefined {
	const segments = url.pathname.split("/").filter(Boolean);
	const index = segments.indexOf(keyword);
	if (index === -1) return;
	const segment = segments[index + 1];
	if (!segment) return;
	try {
		// Google encodes spaces as `+` in specimen paths (`Inter+Tight`).
		return decodeURIComponent(segment).replaceAll("+", " ");
	} catch {
		return;
	}
}

/**
 * Whether the input was meant to be a URL rather than a family name, whether or
 * not we can extract a family from it. Used to tailor error messages.
 */
export function isUrlLike(input: string): boolean {
	const value = input.trim();
	if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(value)) return true;
	const url = toUrl(value);
	return url ? SUPPORTED_HOSTS.includes(getHost(url)) : false;
}

/**
 * Extracts the font family name encoded in a Google Fonts, Fontsource or
 * Fontshare URL. The name is a human-readable name (`Inter Tight`) or a slug
 * (`inter-tight`) depending on the provider, so callers must match it loosely.
 */
export function parseFamilyUrl(input: string): string | undefined {
	const url = toUrl(input);
	if (!url) return;

	switch (getHost(url)) {
		// https://fonts.google.com/specimen/Inter+Tight
		case "fonts.google.com":
			return segmentAfter(url, "specimen");
		// https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400..700
		case "fonts.googleapis.com": {
			// `searchParams` already turns `+` into a space.
			const family = url.searchParams.get("family");
			return family?.split(":")[0].trim() || undefined;
		}
		// https://fontsource.org/fonts/inter-tight
		case "fontsource.org":
			return segmentAfter(url, "fonts");
		// https://www.fontshare.com/fonts/general-sans
		case "fontshare.com":
			return segmentAfter(url, "fonts");
		// https://api.fontshare.com/v2/css?f[]=general-sans@400
		case "api.fontshare.com": {
			const family = url.searchParams.get("f[]");
			return family?.split("@")[0].trim() || undefined;
		}
		default:
			return;
	}
}
