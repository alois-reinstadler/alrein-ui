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
const PAGES = ['/', '/fx', '/button', '/card', '/badge'];
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

function classedElements(markup, className) {
	return markup.match(new RegExp(`class="[^"]*\\b${className}\\b`, 'g')) ?? [];
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
				const found = classedElements(markup, effect);
				assert(found.length === 0, `no ${effect} in server markup (there is no pointer)`);
			}

			// §3.1: press is not opt-in. It stays in the markup at every level and
			// degrades to colour and opacity in CSS at "off" — the class is the
			// carrier, so removing it would be the wrong degradation.
			assert(classedElements(markup, 'fx-press').length > 0, 'press is present at every level');

			if (level === 'off') {
				// §3.2 step 1: dead, with no override possible. This is the CSS-only
				// path, so it has to hold in the markup and not merely at runtime.
				for (const effect of STATIC_EFFECTS) {
					assert(
						classedElements(markup, effect).length === 0,
						`no ${effect} anywhere at data-fx="off"`
					);
				}
			} else {
				pass('static effects may appear where a page asks for them per instance');
			}

			// §3.2 step 1 again, the sticky half: a nested scope asking for
			// "expressive" inside an "off" scope must still resolve "off".
			const offIndex = levels.indexOf('off');
			if (level !== 'off' && offIndex >= 0 && offIndex < levels.length - 1) {
				assert(
					levels.slice(offIndex + 1).every((nested) => nested === 'off'),
					'a scope nested inside data-fx="off" cannot re-enable effects'
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
