#!/usr/bin/env node
/**
 * registry.json validator.
 *
 * The shadcn-svelte CLI validates the *shape* of registry.json but not its
 * relationship to the repository: it will happily emit an item whose file no
 * longer exists on disk, whose npm dependency was never installed, or whose
 * `registryDependencies` silently resolve to somebody else's registry. Those
 * are exactly the failures a consumer discovers, not us — so they get caught
 * here instead.
 *
 * Run after `pnpm registry:build`; the built-output check needs static/r to exist.
 *
 * Zero dependencies, ESM, exits non-zero on any failure.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = join(ROOT, "registry.json");
const OUTPUT_DIR = join(ROOT, "static", "r");

/**
 * Names that resolve against the official shadcn-svelte registry.
 *
 * A bare name in `registryDependencies` ALWAYS means the official registry —
 * never this one. Our own items must be written `local:<name>`. Getting that
 * wrong installs an upstream component over ours with no warning, so a bare
 * name that is not on this list is a hard error.
 *
 * Snapshot of https://shadcn-svelte.com/registry/index.json taken 2026-08-27,
 * with the block/chart/demo families (calendar-NN, chart-*, sidebar-NN,
 * login-NN, signup-NN, otp-NN, demo-*, dashboard-*) omitted for readability.
 * Anything missing here is re-checked against the live index at runtime, so a
 * newly published upstream item does not require editing this file — it only
 * requires network access.
 */
const OFFICIAL_ITEMS = new Set(
	[
		"accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button",
		"button-group calendar card carousel chart checkbox collapsible command context-menu",
		"data-table dialog drawer dropdown-menu empty field form hover-card init input",
		"input-group input-otp is-mobile item kbd label menubar native-select navigation-menu",
		"pagination popover progress radio-group range-calendar resizable scroll-area select",
		"separator sheet sidebar skeleton slider sonner spinner switch table tabs textarea",
		"toggle toggle-group tooltip utils"
	]
		.join(" ")
		.split(" ")
);

const OFFICIAL_INDEX_URL = "https://shadcn-svelte.com/registry/index.json";

const errors = [];
const notes = [];
/** Declared before the first `report()` call site so the early-exit path can read it. */
const seenNames = new Set();

function fail(message) {
	errors.push(message);
}

function readJson(path, label) {
	if (!existsSync(path)) {
		fail(`${label}: file not found at ${path}`);
		return null;
	}
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch (error) {
		fail(`${label}: not valid JSON — ${error.message}`);
		return null;
	}
}

/**
 * Only consulted when a bare name is missing from OFFICIAL_ITEMS, so the happy
 * path stays offline. Failure to reach the network is not itself an error; the
 * caller reports the unknown name instead.
 */
async function fetchOfficialItemNames() {
	try {
		const response = await fetch(OFFICIAL_INDEX_URL, {
			signal: AbortSignal.timeout(8000)
		});
		if (!response.ok) return null;
		const body = await response.json();
		const items = Array.isArray(body) ? body : body?.items;
		if (!Array.isArray(items)) return null;
		return new Set(items.map((item) => item?.name).filter(Boolean));
	} catch {
		return null;
	}
}

/** POSIX-only path helpers: registry paths are always forward-slashed. */
function posixDirname(path) {
	const slash = path.lastIndexOf("/");
	return slash === -1 ? "." : path.slice(0, slash);
}

function posixNormalize(path) {
	const parts = [];
	for (const segment of path.split("/")) {
		if (segment === "" || segment === ".") continue;
		if (segment === ".." && parts.length > 0 && parts.at(-1) !== "..") parts.pop();
		else parts.push(segment);
	}
	return parts.join("/");
}

const registry = readJson(REGISTRY_PATH, "registry.json");
const pkg = readJson(join(ROOT, "package.json"), "package.json");

if (!registry || !pkg) {
	report();
}

const declaredDeps = new Set([
	...Object.keys(pkg.dependencies ?? {}),
	...Object.keys(pkg.devDependencies ?? {})
]);

const items = Array.isArray(registry.items) ? registry.items : null;
if (!items) {
	fail("registry.json: `items` must be an array");
	report();
}

// --- names -----------------------------------------------------------------

for (const [index, item] of items.entries()) {
	const label = `items[${index}]`;
	const name = item?.name;
	if (typeof name !== "string" || name.trim() === "") {
		fail(`${label}: \`name\` is missing or empty`);
		continue;
	}
	if (seenNames.has(name)) {
		fail(`${label} "${name}": duplicate item name — names must be unique`);
	}
	seenNames.add(name);
}

// --- files -----------------------------------------------------------------

for (const item of items) {
	const name = item?.name ?? "<unnamed>";
	const files = item?.files;
	if (!Array.isArray(files) || files.length === 0) {
		fail(`"${name}": \`files\` must be a non-empty array`);
		continue;
	}
	for (const [fileIndex, file] of files.entries()) {
		const label = `"${name}".files[${fileIndex}]`;
		if (typeof file?.path !== "string" || file.path === "") {
			fail(`${label}: \`path\` is missing or empty`);
			continue;
		}
		if (!existsSync(join(ROOT, file.path))) {
			fail(`${label}: \`path\` does not exist on disk — ${file.path}`);
		}
		// `registry:file` has no implicit destination, so the CLI cannot place it
		// without a target. The upstream schema marks it optional; it is not.
		if (typeof file?.target !== "string" || file.target === "") {
			fail(`${label}: \`target\` is required (${file.path})`);
		}
	}
}

// --- relative CSS imports --------------------------------------------------
//
// A shipped stylesheet that `@import`s a stylesheet the item does not ship
// installs cleanly and then fails at build time in the consumer's project, with
// an error that points at their app.css. Catch it here instead.

for (const item of items) {
	const name = item?.name ?? "<unnamed>";
	const files = Array.isArray(item?.files) ? item.files : [];
	const shipped = new Set(
		files.map((file) => (typeof file?.path === "string" ? posixNormalize(file.path) : null))
	);
	for (const file of files) {
		if (typeof file?.path !== "string" || !file.path.endsWith(".css")) continue;
		const absolute = join(ROOT, file.path);
		if (!existsSync(absolute)) continue;
		// Comments stripped first: these files document their own usage with an
		// `@import` example, which is not an import.
		const source = readFileSync(absolute, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
		for (const match of source.matchAll(/@import\s+["'](\.[^"']+)["']/g)) {
			const target = posixNormalize(`${posixDirname(file.path)}/${match[1]}`);
			if (!shipped.has(target)) {
				fail(
					`"${name}": ${file.path} imports "${match[1]}" (${target}), which the item does ` +
						`not ship. Add it to files[] or the consumer's build breaks.`
				);
			}
		}
	}
}

// --- built output ----------------------------------------------------------

for (const name of seenNames) {
	const built = join(OUTPUT_DIR, `${name}.json`);
	if (!existsSync(built)) {
		fail(
			`"${name}": no built output at static/r/${name}.json — run \`pnpm registry:build\` first`
		);
	}
}

// --- registry dependencies -------------------------------------------------

const unknownBareNames = new Set();

for (const item of items) {
	const name = item?.name ?? "<unnamed>";
	const deps = item?.registryDependencies;
	// The registry.json schema requires this key on every item, even when empty.
	if (!Array.isArray(deps)) {
		fail(`"${name}": \`registryDependencies\` must be an array (use [] when there are none)`);
		continue;
	}
	for (const dep of deps) {
		if (typeof dep !== "string" || dep === "") {
			fail(`"${name}": \`registryDependencies\` contains a non-string entry`);
			continue;
		}
		if (dep.startsWith("local:")) {
			const target = dep.slice("local:".length);
			if (!seenNames.has(target)) {
				fail(`"${name}": registryDependency "${dep}" does not match any item in this registry`);
			}
			continue;
		}
		if (/^https?:\/\//.test(dep)) continue;
		if (OFFICIAL_ITEMS.has(dep)) continue;
		if (seenNames.has(dep)) {
			fail(
				`"${name}": registryDependency "${dep}" is a bare name, so it resolves to the ` +
					`OFFICIAL shadcn-svelte registry — not to our item of the same name. ` +
					`Write "local:${dep}".`
			);
			continue;
		}
		unknownBareNames.add(`${name}|${dep}`);
	}
}

if (unknownBareNames.size > 0) {
	const live = await fetchOfficialItemNames();
	for (const entry of unknownBareNames) {
		const [name, dep] = entry.split("|");
		if (live?.has(dep)) {
			notes.push(
				`"${name}": registryDependency "${dep}" is not in the bundled official-item ` +
					`snapshot but does exist upstream. Add it to OFFICIAL_ITEMS in this script.`
			);
			continue;
		}
		fail(
			`"${name}": registryDependency "${dep}" is not a known official shadcn-svelte item, ` +
				`not a \`local:<name>\` reference to one of our items, and not an absolute URL.` +
				(live === null ? " (Could not reach the official registry to double-check.)" : "")
		);
	}
}

// --- npm dependencies ------------------------------------------------------

for (const item of items) {
	const name = item?.name ?? "<unnamed>";
	for (const key of ["dependencies", "devDependencies"]) {
		const deps = item?.[key];
		if (deps === undefined) continue;
		if (!Array.isArray(deps)) {
			fail(`"${name}": \`${key}\` must be an array`);
			continue;
		}
		for (const dep of deps) {
			if (typeof dep !== "string" || dep === "") {
				fail(`"${name}": \`${key}\` contains a non-string entry`);
				continue;
			}
			// Registry deps may pin a version ("bits-ui@^2.19.0"); compare the name only.
			const bare = dep.startsWith("@")
				? `@${dep.slice(1).split("@")[0]}`
				: dep.split("@")[0];
			if (!declaredDeps.has(bare)) {
				fail(
					`"${name}": ${key} "${dep}" is not in package.json dependencies or devDependencies`
				);
			}
		}
	}
}

report();

function report() {
	for (const note of notes) console.warn(`warn  ${note}`);
	if (errors.length > 0) {
		console.error(`\nregistry:check FAILED — ${errors.length} problem(s):\n`);
		for (const error of errors) console.error(`  ✗ ${error}`);
		console.error("");
		process.exit(1);
	}
	console.log(
		`registry:check OK — ${seenNames.size} item(s) validated against disk, static/r and package.json`
	);
	process.exit(0);
}
