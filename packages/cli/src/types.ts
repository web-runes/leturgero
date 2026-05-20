import type { Option } from "@clack/prompts";

export interface Spinner {
	start: (msg: string) => void;
	stop: (msg: string) => void;
}

export interface FontsManager {
	init: () => Promise<void>;
	list: () => Promise<Array<{ family: string; provider: string }>>;
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
