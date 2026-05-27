import { writeFile } from "node:fs/promises";
import { intro, outro } from "@clack/prompts";
import { defineCommand, runMain } from "citty";
import pkg from "../package.json" with { type: "json" };
import { proxySources } from "./core/proxy-sources.js";
import { saveToDisk } from "./core/save-to-disk.js";
import { selectFamily } from "./core/select-family.js";
import { selectPaths } from "./core/select-paths.js";
import { selectProperties } from "./core/select-properties.js";
import { ClackAutocomplete } from "./infra/clack-autocomplete.js";
import { ClackDirectoryPicker } from "./infra/clack-directory-picker.js";
import {
	ClackCancelError,
	ClackErrorHandler,
} from "./infra/clack-error-handler.js";
import { ClackLogger } from "./infra/clack-logger.js";
import { ClackMultiselect } from "./infra/clack-multiselect.js";
import { ClackProgress } from "./infra/clack-progress.js";
import { ClackSpinner } from "./infra/clack-spinner.js";
import { CryptoHasher } from "./infra/crypto-hasher.js";
import { FuseSearch } from "./infra/fuse-search.js";
import { UnifontFontsManager } from "./infra/unifont-fonts-manager.js";

const main = defineCommand({
	meta: {
		name: pkg.name,
		description: pkg.description,
		version: pkg.version,
	},
	args: {},
	async run() {
		const errorHandler = new ClackErrorHandler();
		try {
			const createSpinner = () => new ClackSpinner();
			const createAutocomplete = () => new ClackAutocomplete();
			const createMultiselect = () => new ClackMultiselect();
			const createDirectoryPicker = () => new ClackDirectoryPicker();
			const createProgress = (max: number) => new ClackProgress({ max });
			const logger = new ClackLogger();
			const hasher = new CryptoHasher();

			intro("Welcome!");

			const initSpinner = createSpinner();
			initSpinner.start("Initializing...");
			const fontsManager = await UnifontFontsManager.create();
			initSpinner.stop("Initialized");

			const root = process.cwd();

			const paths = await selectPaths({
				directoryPicker: createDirectoryPicker(),
				root,
			});

			const family = await selectFamily({
				fontsManager,
				autocomplete: createAutocomplete(),
				createSearch: (items) => new FuseSearch(items, ["name"]),
			});

			const suggestions = await fontsManager.getSuggestions(family);

			const properties = await selectProperties({
				suggestions,
				createMultiselect,
				logger,
			});

			const resolveSpinner = createSpinner();
			resolveSpinner.start("Resolving font data...");
			const resolved = await fontsManager.resolve(family, properties);
			resolveSpinner.stop("Resolved");

			if (resolved.fonts.length === 0) {
				logger.warn("No fonts found, aborting");
				return;
			}

			let fonts = resolved.fonts;

			const proxyResult = await proxySources({
				family: family.name,
				fonts,
				fontsDir: paths.fonts,
				hasher,
				root,
				createProgress,
				createCancelError: () => new ClackCancelError(),
				fetch: (url) =>
					fetch(url)
						.then((res) => res.arrayBuffer())
						.then((e) => Buffer.from(e)),
			});

			fonts = proxyResult.fonts;

			await saveToDisk({
				filenameToContents: proxyResult.filenameToContents,
				fontsDir: paths.fonts,
				writeFile,
			});

			// TODO: ask for fallbacks (use resolved.fallbacks)

			// TODO: emit css

			// TODO: next steps (docs)

			outro("Thank you!");
		} catch (error) {
			errorHandler.onError(error);
		}
	},
});

runMain(main);
