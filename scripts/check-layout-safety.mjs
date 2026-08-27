#!/usr/bin/env node
/**
 * Acceptance criterion §7.10, mechanised: **no effect may change an element's
 * layout box.**
 *
 * SPEC.md §1 permits effects to touch transform, filter, opacity and background
 * only. §7.10 asks for that to be verified by toggling `data-fx` and observing
 * zero reflow. Eyeballing a reflow is unreliable and untestable in CI, so this
 * checks the stronger, static form instead: parse the *built* stylesheet and
 * assert that no rule whose selector mentions an `fx-` utility or a `data-fx`
 * scope declares a single layout-affecting property.
 *
 * If that holds, toggling `data-fx` cannot reflow, because there is nothing in
 * the effect layer capable of reflowing.
 *
 * Run after `vite build`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ASSET_DIRS = [
	resolve(import.meta.dirname, '../.svelte-kit/output/client/_app/immutable/assets'),
	resolve(import.meta.dirname, '../build/_app/immutable/assets')
];

/**
 * Properties that resize, reposition or reflow the element or its siblings.
 * Anything here inside an effect rule is a defect, not a style choice.
 */
const LAYOUT_PROPERTIES = new Set([
	'width', 'min-width', 'max-width',
	'height', 'min-height', 'max-height',
	'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
	'padding-block', 'padding-inline',
	'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
	'margin-block', 'margin-inline',
	'border-width', 'border-top-width', 'border-right-width',
	'border-bottom-width', 'border-left-width', 'border-style',
	'display', 'box-sizing', 'gap', 'row-gap', 'column-gap',
	'flex', 'flex-basis', 'flex-grow', 'flex-shrink', 'flex-direction', 'flex-wrap',
	'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
	'grid-auto-flow', 'grid-auto-columns', 'grid-auto-rows',
	'font-size', 'font-weight', 'font-family', 'line-height', 'letter-spacing',
	'word-spacing', 'white-space', 'writing-mode', 'zoom', 'aspect-ratio',
	'float', 'clear', 'columns', 'column-count', 'column-width'
]);

/**
 * `transition` and `animation` shorthands name properties rather than setting
 * them, so a `transition: width …` is just as much a reflow as `width: 10px`.
 * The prior attempt had 67 of these (SPEC.md §8, `F11`).
 */
const TIMING_PROPERTIES = new Set(['transition', 'transition-property', 'animation', 'animation-name']);

/** A rule is part of the effect layer if its selector mentions either of these. */
function isEffectSelector(selector) {
	return /\.fx-[a-z-]/.test(selector) || /\[data-fx[\]=]/.test(selector);
}

/**
 * `position: absolute` takes a pseudo-element out of flow, so its own `inset`
 * cannot move anything else. `inset` on an in-flow element can.
 */
function isOutOfFlow(body) {
	return /position\s*:\s*(absolute|fixed)/.test(body);
}

const IN_FLOW_ONLY = new Set(['inset', 'top', 'right', 'bottom', 'left']);

function splitRules(css) {
	// Flat scan: at-rule preludes are skipped, and their inner rules are visited
	// on their own, which is all we need — the property check does not care which
	// media query a rule sits in.
	const rules = [];
	let depth = 0;
	let selectorStart = 0;
	for (let i = 0; i < css.length; i += 1) {
		const char = css[i];
		if (char === '{') {
			if (depth === 0) {
				const selector = css.slice(selectorStart, i).trim();
				const close = findClose(css, i);
				if (!selector.startsWith('@')) {
					rules.push({ selector, body: css.slice(i + 1, close) });
					i = close;
					selectorStart = i + 1;
					continue;
				}
				// Descend into the at-rule and scan its children.
				const inner = css.slice(i + 1, close);
				for (const rule of splitRules(inner)) rules.push(rule);
				i = close;
				selectorStart = i + 1;
				continue;
			}
			depth += 1;
		} else if (char === '}') {
			depth -= 1;
			selectorStart = i + 1;
		}
	}
	return rules;
}

function findClose(css, open) {
	let depth = 0;
	for (let i = open; i < css.length; i += 1) {
		if (css[i] === '{') depth += 1;
		else if (css[i] === '}') {
			depth -= 1;
			if (depth === 0) return i;
		}
	}
	return css.length;
}

async function findStylesheets() {
	for (const dir of ASSET_DIRS) {
		try {
			const names = (await readdir(dir)).filter((name) => name.endsWith('.css'));
			if (names.length > 0) return names.map((name) => join(dir, name));
		} catch {
			// Directory does not exist; try the next build output location.
		}
	}
	return [];
}

const sheets = await findStylesheets();
if (sheets.length === 0) {
	console.error('layout-safety: no built stylesheet found. Run `pnpm exec vite build` first.');
	process.exit(1);
}

const violations = [];
let effectRules = 0;

for (const sheet of sheets) {
	const css = await readFile(sheet, 'utf8');
	for (const { selector, body } of splitRules(css)) {
		if (!isEffectSelector(selector)) continue;
		effectRules += 1;
		const outOfFlow = isOutOfFlow(body);

		for (const declaration of body.split(';')) {
			const colon = declaration.indexOf(':');
			if (colon < 0) continue;
			const property = declaration.slice(0, colon).trim().toLowerCase();
			const value = declaration.slice(colon + 1).trim();
			if (property.startsWith('--')) continue;

			if (LAYOUT_PROPERTIES.has(property)) {
				violations.push({ sheet, selector, property, value, why: 'sets a layout property' });
				continue;
			}
			if (IN_FLOW_ONLY.has(property) && !outOfFlow) {
				violations.push({ sheet, selector, property, value, why: 'offsets an in-flow element' });
				continue;
			}
			if (TIMING_PROPERTIES.has(property)) {
				const named = [...LAYOUT_PROPERTIES].filter((layout) =>
					new RegExp(`(^|[\\s,])${layout}([\\s,]|$)`).test(value)
				);
				for (const layout of named) {
					violations.push({
						sheet,
						selector,
						property,
						value,
						why: `animates the layout property \`${layout}\``
					});
				}
			}
		}
	}
}

if (violations.length > 0) {
	console.error(`layout-safety: ${violations.length} violation(s) of SPEC.md §1 / §7.10\n`);
	for (const violation of violations) {
		console.error(`  ${violation.selector}`);
		console.error(`    ${violation.property}: ${violation.value}  — ${violation.why}`);
	}
	console.error('\nEffects may touch transform, filter, opacity and background only.');
	process.exit(1);
}

console.log(
	`layout-safety OK — ${effectRules} effect rule(s) checked across ${sheets.length} stylesheet(s), ` +
		'none touch the layout box'
);
