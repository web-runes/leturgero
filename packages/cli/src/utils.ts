export function kebabize(str: string): string {
	return str.toLowerCase().replace(/\s+/g, "-");
}
