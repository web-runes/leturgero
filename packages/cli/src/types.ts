import type { Option } from "@clack/prompts";
import type { FontFaceData, FontStyles, ResolveFontOptions } from "unifont";

export interface Spinner {
	start: (msg: string) => void;
	stop: (msg: string) => void;
}

export type FontFormat = ResolveFontOptions["formats"][number];

export interface FamilyProperties {
	weights: Array<string>;
	styles: Array<FontStyles>;
	formats: Array<FontFormat>;
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
	resolve: (
		family: MinimalFamily,
		properties: FamilyProperties,
	) => Promise<{
		fonts: Array<FontFaceData>;
		fallbacks: Array<string> | undefined;
	}>;
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
	readonly total: number;
	readonly items: Array<T>;
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
	warn: (msg: string) => void;
}

export interface DirectoryPickerOptions {
	message: string;
	root: string;
}

export interface DirectoryPicker {
	pick: (options: DirectoryPickerOptions) => Promise<string>;
}

export interface Hasher {
	hash: (input: Buffer) => string;
}

export interface Progress {
	start: (msg: string) => void;
	advance: (step: number) => void;
	stop: (msg: string) => void;
	error: (msg: string) => void;
}

export interface TextOptions {
	message: string;
	initialValue?: string;
	validate?: (value: string | undefined) => string | undefined;
}

export interface Text {
	run: (options: TextOptions) => Promise<string>;
}

export interface Confirm {
	run: (message: string) => Promise<boolean>;
}
