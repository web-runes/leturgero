import type { Option } from "@clack/prompts";

export interface Spinner {
	start: (msg: string) => void;
	stop: (msg: string) => void;
}

export interface FamilyProperties {
	weights: Array<string>;
	styles: Array<string>;
	formats: Array<string>;
	subsets: Array<string> | undefined;
}

export type FamilySuggestions = Partial<FamilyProperties>;

export interface MinimalFamily {
	name: string;
	provider: string;
}

export interface FontsManager {
	list: () => Promise<Array<MinimalFamily>>;
	getSuggestions: (
		family: MinimalFamily,
	) => Promise<FamilySuggestions | undefined>;
}

export interface ErrorHandler {
	onError: (error: unknown) => void;
}

export interface AutocompleteOptions<T> {
	message: string;
	onSearch: (input: string) => Array<Option<T>>;
}

export interface Autocomplete {
	run: <T>(options: AutocompleteOptions<T>) => Promise<T>;
}

export interface Search<T extends Record<string, any>> {
	search: (input: string) => Array<T>;
}

export interface MultiselectOptions<T> {
	message: string;
	options: Array<Option<T>>;
}

export interface Multiselect {
	run: <T>(options: MultiselectOptions<T>) => Promise<Array<T>>;
}

export interface Logger {
	step: (msg: string) => void;
}
