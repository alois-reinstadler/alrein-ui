#!/usr/bin/env node
/**
 * Guards against an upstream `shadcn-svelte add` silently reverting a superset.
 *
 * This is not hypothetical. Running `shadcn-svelte add field input-group`
 * pulled `button` in as a registry dependency and overwrote
 * `ui/button/button.svelte` with the stock upstream file, deleting the whole
 * alrein Button. `svelte-check` caught it only because the demo page happened to
 * pass props that no longer existed — with no such call site it would have
 * shipped.
 *
 * That is failure `F2` from the other direction: the previous attempt's registry
 * clobbered *consumers*; this clobbers *us*. Same root cause — a file at a shared
 * path with two owners and nothing asserting which one is there.
 *
 * The check is deliberately dumb: every file we claim to have extended must
 * still say so. A marker comment is cheap, survives editing, and cannot be
 * present by accident in a file the upstream CLI just wrote.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const MARKER = 'alrein-ui';

/**
 * Every component file we have extended, and therefore every file an upstream
 * `add` could take back. Add a line here when you extend a new component — the
 * check has no way to infer it, because "a file that used to be different" is
 * not something a single run can see.
 */
const SUPERSETS = [
	'src/lib/components/ui/button/button.svelte',
	'src/lib/components/ui/badge/badge.svelte',
	'src/lib/components/ui/card/card.svelte',
	'src/lib/components/ui/checkbox/checkbox.svelte',
	'src/lib/components/ui/switch/switch.svelte',
	'src/lib/components/ui/radio-group/radio-group.svelte',
	'src/lib/components/ui/radio-group/radio-group-item.svelte',
	'src/lib/components/ui/field/field.svelte',
	'src/lib/components/ui/spinner/spinner.svelte',
	'src/lib/components/ui/steps/steps.svelte',
	'src/lib/components/ui/timeline/timeline.svelte',
	'src/lib/components/ui/rating/rating.svelte',
	'src/lib/components/ui/chip/chip.svelte',
	'src/lib/components/ui/skeleton/skeleton-group.svelte',
	'src/lib/components/ui/button-group/button-group.svelte',
	'src/lib/components/ui/input/input.svelte',
	'src/lib/components/ui/textarea/textarea.svelte',
	'src/lib/components/ui/select/select-trigger.svelte',
	'src/lib/components/ui/select/select-content.svelte',
	'src/lib/components/ui/alert/alert.svelte',
	'src/lib/components/ui/tooltip/tooltip-content.svelte'
];

const missing = [];

for (const relative of SUPERSETS) {
	let source;
	try {
		source = await readFile(resolve(ROOT, relative), 'utf8');
	} catch {
		missing.push({ relative, why: 'file is gone' });
		continue;
	}
	if (!source.includes(MARKER)) {
		missing.push({ relative, why: `no "${MARKER}" marker — looks like the stock upstream file` });
	}
}

if (missing.length > 0) {
	console.error(`supersets:check — ${missing.length} component(s) look reverted to upstream:\n`);
	for (const { relative, why } of missing) console.error(`  ${relative}\n    ${why}`);
	console.error(
		'\nAn upstream `shadcn-svelte add` most likely pulled one of these in as a\n' +
			'registry dependency and overwrote it. Recover with `git checkout -- <path>`,\n' +
			'then re-run the add with the affected component already committed.'
	);
	process.exit(1);
}

console.log(`supersets:check OK — ${SUPERSETS.length} extended component(s) still carry their marker`);
