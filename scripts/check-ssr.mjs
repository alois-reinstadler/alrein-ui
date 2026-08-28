#!/usr/bin/env node
/**
 * Server-rendered behaviour checks for the effect policy.
 *
 * There is no browser automation host in this environment, so acceptance
 * criteria §7.7 (correct at every `data-fx` level) and §7.9 (no pointer-tracked
 * effects without a fine pointer) cannot be verified by looking. They can still
 * be verified *mechanically*, because the policy decides which classes reach the
 * markup — and the server is a machine with no pointer, which is the same
 * situation as a touch device.
 *
 * This boots the dev server, fetches every docs page at every effect level, and
 * asserts what may and may not appear. It found one real bug on its first run:
 * `<FxScope>` configured its context in `$effect.pre`, which does not run during
 * SSR, so every scope rendered its *parent's* level server-side and corrected
 * only on hydration — defeating the reason §3.3 puts a literal `data-fx`
 * attribute in the DOM at all.
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
// Vary the port so a stale server from a previous run cannot answer for us.
const PORT = 4173 + Number(process.hrtime.bigint() % 200n);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const PAGES = ['/', '/fx', '/button', '/card', '/badge', '/input', '/textarea', '/checkbox', '/radio-group', '/switch', '/select', '/field', '/spinner', '/alert', '/tooltip', '/avatar', '/skeleton', '/chip', '/rating', '/button-group', '/steps', '/timeline', '/color-picker', '/code', '/code-window', '/upload-area', '/tabs', '/accordion', '/breadcrumb', '/pagination', '/sidebar'];
const LEVELS = ['off', 'calm', 'expressive'];

/** Effects the engine drives from a pointer. A server has none, so must a touch device. */
const POINTER_TRACKED = ['fx-glow', 'fx-tilt', 'fx-magnet'];
/** Static surface treatments, which survive both. */
const STATIC_EFFECTS = ['fx-gradient', 'fx-shimmer'];

const failures = [];
function assert(condition, message) {
	if (condition) return;
	failures.push(message);
	console.error(`      ✗ ${message}`);
}
function pass(message) {
	console.log(`      ✓ ${message}`);
}

/** Strips <style> and <script> so dev-mode inlined CSS is not mistaken for markup. */
function markupOnly(html) {
	return html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '');
}

/**
 * Elements carrying `className` as a whole class token.
 *
 * Comparing tokens rather than pattern-matching inside the attribute, because a
 * word boundary is not enough: `\bfx-shimmer\b` also matches inside
 * `[animation-duration:var(--fx-shimmer-duration)]`, which is a *token* the
 * loading spinner legitimately reads and not the shimmer effect at all.
 */
function classedElements(markup, className) {
	const found = [];
	for (const match of markup.matchAll(/class="([^"]*)"/g)) {
		if (match[1].split(/\s+/).includes(className)) found.push(match[0]);
	}
	return found;
}

/**
 * The whole opening tag around a `class="…"` match.
 *
 * Deliberately not `/<[^>]*>/`: a Tailwind class value contains `>` all the
 * time — `[&>span:last-child]`, `group-data-[orientation=vertical]/tabs:after:…`
 * — so a `[^>]*` scan ends the tag in the middle of an attribute. This walks
 * forward from the `<` and only treats `>` as the end when it is outside quotes.
 */
function enclosingTag(markup, index) {
	const start = markup.lastIndexOf('<', index);
	if (start === -1) return '';
	let quote = null;
	for (let i = start; i < markup.length; i += 1) {
		const char = markup[i];
		if (quote) {
			if (char === quote) quote = null;
		} else if (char === '"' || char === "'") {
			quote = char;
		} else if (char === '>') {
			return markup.slice(start, i + 1);
		}
	}
	return markup.slice(start);
}

/**
 * Elements carrying `className`, minus the ones where it is a *variant* rather
 * than an effect.
 *
 * A31 moved Button's `gradient`, `glow` and `shimmer` into its `variant` enum,
 * so `fx-gradient` and friends are now in Button's markup unconditionally — the
 * author asked for that surface, and the matrix no longer governs it. They are
 * still effects on Alert, Card, Badge and the rest, and the guarantees below are
 * still worth asserting *there*, so the assertions exclude Button by slot rather
 * than being dropped.
 */
function classedEffectElements(markup, className) {
	const found = [];
	for (const match of markup.matchAll(/class="([^"]*)"/g)) {
		if (!match[1].split(/\s+/).includes(className)) continue;
		const tag = enclosingTag(markup, match.index);
		if (/data-slot="button"/.test(tag)) continue;
		found.push(tag);
	}
	return found;
}

function scopeLevels(markup) {
	return [...markup.matchAll(/<div[^>]*data-slot="fx-scope"[^>]*>/g)].map((match) => {
		const level = /data-fx="(\w+)"/.exec(match[0]);
		return level ? level[1] : null;
	});
}

const server = spawn('pnpm', ['exec', 'vite', 'dev', '--host', '127.0.0.1', '--port', String(PORT)], {
	cwd: ROOT,
	stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
server.stdout.on('data', (chunk) => (serverOutput += chunk));
server.stderr.on('data', (chunk) => (serverOutput += chunk));

function stop() {
	server.kill('SIGTERM');
}
process.on('exit', stop);

async function waitForReady(timeoutMs = 60_000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(ORIGIN, { signal: AbortSignal.timeout(3000) });
			if (response.ok) return;
		} catch {
			// Not up yet.
		}
		await new Promise((r) => setTimeout(r, 400));
	}
	throw new Error(`dev server did not become ready on ${ORIGIN}\n${serverOutput}`);
}

try {
	console.log(`ssr:check — booting the dev server on ${ORIGIN}`);
	await waitForReady();

	for (const path of PAGES) {
		for (const level of LEVELS) {
			const url = `${ORIGIN}${path}?fx=${level}`;
			console.log(`\n  ${path}  at data-fx="${level}"`);
			const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
			assert(response.ok, `${url} responded ${response.status}`);
			if (!response.ok) continue;

			const markup = markupOnly(await response.text());
			const levels = scopeLevels(markup);

			assert(levels.length > 0, 'the page renders at least one <FxScope>');
			assert(
				levels[0] === level,
				`the outermost scope resolves to "${level}" server-side (got "${levels[0]}")`
			);

			// §3.2 steps 2 and 3, and §7.9. A server has no pointer, so these can
			// never be lit at render time regardless of the level or the prop.
			for (const effect of POINTER_TRACKED) {
				const found = classedEffectElements(markup, effect);
				assert(
					found.length === 0,
					`no ${effect} in server markup where it is an effect (there is no pointer)`
				);
			}

			// §3.1: press is not opt-in. Where there is something pressable it stays
			// in the markup at *every* level, including "off", where it degrades to
			// colour and opacity in CSS — the class is the carrier, so removing it
			// would be the wrong degradation.
			//
			// Conditional on there being a pressable element at all: a page of form
			// fields has nothing to press, and Input deliberately has no press
			// (§3.4 gives form fields no effects).
			// Only things that press *unconditionally*. A plain Card does not: it
			// gains press with `interactive`, and the Spinner page renders two
			// non-interactive ones to demonstrate the overlay.
			const pressable = (markup.match(/data-slot="(?:button|checkbox-card|radio-card)"/g) ?? []).length;
			if (pressable > 0) {
				assert(
					classedElements(markup, 'fx-press').length > 0,
					`press is present at every level (page has ${pressable} pressable element(s))`
				);
			}

			if (level === 'off') {
				// §3.2 step 1: dead, with no override possible. This is the CSS-only
				// path, so it has to hold in the markup and not merely at runtime.
				for (const effect of STATIC_EFFECTS) {
					assert(
						classedEffectElements(markup, effect).length === 0,
						`no ${effect} where it is an effect at data-fx="off"`
					);
				}
			} else {
				pass('static effects may appear where a page asks for them per instance');
			}

			// §3.2 step 1 again, the sticky half: a scope asking for "expressive"
			// from inside an "off" scope must still resolve "off". The demo pages
			// tag that exact element, because inferring nesting from document order
			// breaks as soon as a sibling scope appears further down the page.
			for (const tag of markup.match(/<div[^>]*data-ssr-check="sticky-off"[^>]*>/g) ?? []) {
				const resolved = /data-fx="(\w+)"/.exec(tag);
				assert(
					resolved?.[1] === 'off',
					`a scope nested inside data-fx="off" resolves to "off" (got "${resolved?.[1]}")`
				);
			}
		}
	}

	console.log();
	if (failures.length > 0) {
		console.error(`ssr:check FAILED — ${failures.length} assertion(s):`);
		for (const failure of failures) console.error(`  - ${failure}`);
		process.exit(1);
	}
	console.log(
		`ssr:check OK — ${PAGES.length} page(s) × ${LEVELS.length} level(s), ` +
			'effect policy resolves correctly server-side'
	);
} finally {
	stop();
}
