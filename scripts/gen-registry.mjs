#!/usr/bin/env node
/**
 * Generates `registry.json` from `registry.config.mjs`.
 *
 * The point is that a component's file list is *read from disk* rather than
 * transcribed. Adding a file to a component then cannot be forgotten, which is
 * the failure the consumer smoke test caught once already: the theme item shipped
 * two of its four stylesheets, installed cleanly, and only broke at the
 * consumer's `vite build` on a missing `@import`.
 *
 * Run with `--check` in CI to assert the committed `registry.json` matches.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { NEVER_SHIP, registry } from '../registry.config.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'registry.json');
const check = process.argv.includes('--check');

/** Extension → registry file type. Anything else is a `registry:file`. */
function fileType(itemType, name) {
	if (itemType === 'registry:ui' && (name.endsWith('.svelte') || name.endsWith('.ts'))) {
		return 'registry:ui';
	}
	return 'registry:file';
}

async function listFiles(dir) {
	const entries = await readdir(join(ROOT, dir), { withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => entry.name)
		.filter((name) => !NEVER_SHIP.some((pattern) => pattern.test(name)))
		.sort();
}

const items = [];

for (const item of registry.items) {
	const { dir, uiTarget, rootTarget, ...rest } = item;
	const names = await listFiles(dir);
	if (names.length === 0) throw new Error(`registry: item "${item.name}" has no shippable files in ${dir}`);

	items.push({
		...rest,
		registryDependencies: rest.registryDependencies ?? [],
		files: names.map((name) => ({
			path: `${dir}/${name}`,
			type: fileType(item.type, name),
			// A `registry:ui` target is relative to the consumer's `ui` alias, which
			// is what overwrites the upstream component in place. Everything else is
			// rooted at the project with `~/`.
			target: uiTarget ? `${uiTarget}/${name}` : `~/${rootTarget}/${name}`
		}))
	});
}

const generated =
	JSON.stringify(
		{
			$schema: 'https://shadcn-svelte.com/schema/registry.json',
			name: registry.name,
			homepage: registry.homepage,
			aliases: registry.aliases,
			items
		},
		null,
		'\t'
	) + '\n';

if (check) {
	const existing = await readFile(OUT, 'utf8').catch(() => '');
	if (existing !== generated) {
		console.error(
			'registry:gen --check — registry.json is out of date.\n' +
				'Run `pnpm registry:gen` and commit the result.'
		);
		process.exit(1);
	}
	console.log(`registry:gen OK — registry.json matches ${items.length} declared item(s)`);
} else {
	await writeFile(OUT, generated);
	const fileCount = items.reduce((total, item) => total + item.files.length, 0);
	console.log(`registry:gen — wrote ${items.length} item(s), ${fileCount} file(s) to registry.json`);
}
