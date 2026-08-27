#!/usr/bin/env node
/**
 * Hard-ban checker — mechanises SPEC.md §1 "Hard bans" and the §8.3 pre-flight
 * checklist so the §8.1 failure patterns cannot come back by accident.
 *
 * Every rule id maps to a numbered failure in SPEC.md §8.1:
 *
 *   F4-minified   §8.1 F4  — minified source; lines up to 2 996 characters.
 *   F5-duration   §8.1 F5  — 934 hardcoded time values, 0 uses of the motion scale.
 *   F5-easing     §8.1 F5  — 612 literal cubic-bezier() across 34 distinct curves.
 *   F6-spring     §8.1 F6  — the spring curve used 124 times in 30 components.
 *   F9-raf        §8.1 F9  — requestAnimationFrame in 62 files; no singleton engine.
 *   F9-listener   §8.1 F9  — per-instance pointermove/scroll/resize listeners.
 *   F11-layout    §8.1 F11 — 67 transitions animating the layout box.
 *   F12-timer     §8.1 F12 — 69 setTimeout + 4 setInterval used as an animation sequencer.
 *   F13-dom       §8.1 F13 — 27 files calling document.createElement; innerHTML copying.
 *   F15-color     §8.1 F15 — 281 raw hex literals outside the token system.
 *   F17-important §8.1 F17 — !important as an escape hatch from an unwinnable cascade.
 *   S1-svelte4    §8.2     — Svelte 4 idiom. resax had zero of these; keep it that way.
 *   S2-clsx       §1       — clsx used directly instead of cn().
 *
 * Scope: src/**\/*.{svelte,ts,css}. By default only the files that differ from
 * origin/main (or main), so a rule can be tightened without having to fix the
 * whole tree in the same commit. Falls back to every tracked file under src/
 * when neither ref exists.
 *
 *   node scripts/check-bans.mjs            # diff against origin/main or main
 *   node scripts/check-bans.mjs --all      # every tracked file under src/
 *   node scripts/check-bans.mjs --staged   # staged files only
 *
 * Zero dependencies, ESM, exits non-zero when any rule fires.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The one file where the motion scale is allowed to be written out literally. */
const TOKENS = "src/lib/styles/alrein/tokens.css";

/**
 * F4 line-length limits.
 *
 * Measured with quoted string literals collapsed to a placeholder. A Tailwind
 * class list is one long unbreakable token — upstream shadcn-svelte's own
 * button.svelte carries a 613-character `base:` string, and §1 requires us to
 * ship a byte-identical superset of it, so a raw character count would fail on
 * files we are contractually not allowed to reformat. Collapsing string
 * literals measures the thing F4 is actually about: how much *code* is packed
 * onto one line. Minified script and minified CSS have no string literals to
 * collapse, so they still fire.
 *
 * HARD_LINE_LIMIT is the backstop for the resax case: 700 bytes/line average,
 * individual lines up to 2 996 characters (SPEC.md §8.1 F4). No legitimate
 * Tailwind class list gets near it.
 */
const CODE_LINE_LIMIT = 160;
const HARD_LINE_LIMIT = 700;

/**
 * The rules.
 *
 * `test`    (line, ctx) => boolean          ctx: { path, ext, isStyle, lineNumber }
 * `include` optional (ctx) => boolean       further narrows the default src glob
 * `exclude` optional string[]               allowlisted paths; exact or `dir/**`
 *
 * Adding a rule is appending one object; nothing else in this file changes.
 */
export const RULES = [
	{
		id: "F5-duration",
		description:
			"Literal duration in a transition/animation declaration. Use the motion scale: " +
			"a `duration-instant|fast|base|slow` utility, or var(--transition-duration-*).",
		include: (ctx) => ctx.isStyle,
		exclude: [TOKENS],
		test: (line) => {
			for (const decl of matchDeclarations(line, /(?:transition|animation)(?:-duration)?/)) {
				if (/(?:^|[^\w.-])[0-9]*\.?[0-9]+m?s(?![\w-])/.test(decl)) return true;
			}
			return false;
		}
	},
	{
		id: "F5-easing",
		description:
			"Literal cubic-bezier(). Use the easing scale: an `ease-fx-out|in|spring` utility, " +
			"or var(--ease-fx-*).",
		exclude: [TOKENS],
		test: (line) => /cubic-bezier\s*\(/.test(line)
	},
	{
		id: "F6-spring",
		description:
			"The spring curve is restricted to press feedback and toggle thumbs only " +
			"(switch thumb, checkbox mark). It overshoots, and overshoot anywhere else reads " +
			"as slow and drunk in a data-dense screen.",
		exclude: ["src/lib/fx/press.ts", TOKENS],
		test: (line) => /ease-fx-spring/.test(line)
	},
	{
		id: "F9-raf",
		description:
			"requestAnimationFrame outside the singleton pointer engine. All pointer-tracked " +
			"effects register with src/lib/fx/pointer.svelte.ts, which runs one rAF for the page.",
		exclude: ["src/lib/fx/pointer.svelte.ts"],
		test: (line) => /requestAnimationFrame/.test(line)
	},
	{
		id: "F9-listener",
		description:
			"pointermove/scroll/resize listener outside the singleton pointer engine. " +
			"One shared listener lives in src/lib/fx/pointer.svelte.ts; per-instance listeners " +
			"are what melted the laptop last time.",
		exclude: ["src/lib/fx/pointer.svelte.ts"],
		test: (line) => /addEventListener\s*\(\s*["'`](?:pointermove|scroll|resize)["'`]/.test(line)
	},
	{
		id: "F11-layout",
		description:
			"Transition on a property that moves the layout box. Effects may animate " +
			"transform, filter, opacity and background only.",
		test: (line) => {
			for (const decl of matchDeclarations(line, /transition(?:-property)?/)) {
				if (/(?:^|[^\w-])(?:width|height|padding|margin|top|left|right|bottom|inset|gap)(?![\w-])/.test(decl)) {
					return true;
				}
			}
			return false;
		}
	},
	{
		id: "F12-timer",
		description:
			"setTimeout/setInterval in library code. Every one is a duration duplicated from a " +
			"CSS transition and guaranteed to desync. Sequence with transitions or the " +
			"doubleRaf helper instead.",
		include: (ctx) => ctx.path.startsWith("src/lib/") && !isTestFile(ctx.path),
		test: (line) => /\b(?:setTimeout|setInterval)\s*\(/.test(line)
	},
	{
		id: "F13-dom",
		description:
			"Imperative DOM construction in library code. document.createElement and innerHTML " +
			"destroy snippet content, break SSR and open an XSS surface. Render it in Svelte.",
		include: (ctx) => ctx.path.startsWith("src/lib/"),
		test: (line) => /document\.createElement|\.innerHTML/.test(line)
	},
	{
		id: "F15-color",
		description:
			"Hardcoded colour. Colours resolve to shadcn tokens (--primary, --ring, --muted, …) " +
			"or to --fx-tint via color-mix(in oklab, …).",
		include: (ctx) => ctx.isStyle,
		// shadcn's own generated palette lives in app.css and is not ours to police.
		exclude: ["src/app.css"],
		test: (line) =>
			/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/.test(line) ||
			/(?:^|[^\w-])rgba?\s*\(/.test(line)
	},
	{
		id: "F17-important",
		description:
			"!important is an admission that the cascade has become unwinnable. Fix the " +
			"specificity instead; the class prop must always be able to win.",
		test: (line) => /!important/.test(line)
	},
	{
		id: "F4-minified",
		description:
			`Line longer than ${CODE_LINE_LIMIT} characters of code, or ${HARD_LINE_LIMIT} ` +
			"characters outright. Minified source cannot be reviewed or diffed, which is how " +
			"most of the §8.1 list survived last time.",
		include: (ctx) => ctx.ext === ".svelte" || ctx.ext === ".ts",
		test: (_line, ctx) =>
			ctx.raw.length > HARD_LINE_LIMIT ||
			collapseStringLiterals(ctx.raw).length > CODE_LINE_LIMIT
	},
	{
		id: "S1-svelte4",
		description:
			"Svelte 4 idiom. Use {@attach} not use:, snippets not slots, callback props not " +
			"createEventDispatcher, $props() not $$props/$$restProps, a rune class not a store, " +
			"tailwind-variants not cva.",
		test: (line, ctx) =>
			(ctx.ext === ".svelte" && !ctx.isStyle && /(?:^|\s)use:[a-zA-Z_$]/.test(line)) ||
			/<slot[\s/>]/.test(line) ||
			/\$\$props|\$\$restProps/.test(line) ||
			/createEventDispatcher/.test(line) ||
			/svelte:component/.test(line) ||
			/from\s*["']svelte\/store["']/.test(line) ||
			/from\s*["']class-variance-authority["']/.test(line)
	},
	{
		id: "S2-clsx",
		description: "clsx() called directly. Use cn() from $lib/utils so tailwind-merge runs.",
		exclude: ["src/lib/utils.ts"],
		test: (line) => /(?:^|[^\w.$])clsx\s*\(/.test(line)
	}
];

// --- helpers ---------------------------------------------------------------

/**
 * Yields the value part of every `<property>: …` declaration on the line whose
 * property matches `propertyPattern`.
 *
 * The leading `(?:^|[;{\s"'])` is what keeps the custom properties in
 * tokens.css (`--transition-duration-base: 180ms`) from matching: the character
 * before the property name would be `-`, which is not in that class.
 */
function* matchDeclarations(line, propertyPattern) {
	const pattern = new RegExp(
		`(?:^|[;{\\s"'])(?:-webkit-|-moz-)?${propertyPattern.source}\\s*:([^;}"']*)`,
		"g"
	);
	for (const match of line.matchAll(pattern)) yield match[1];
}

/**
 * Strips comments so a doc comment can name a banned construct in order to
 * explain why it is banned. That is not a loophole — nothing in a comment runs —
 * and without it every "do not use requestAnimationFrame here" note trips the
 * rule it is documenting.
 *
 * Quote state is tracked so that `//` inside a string (a URL, a Tailwind class)
 * survives. `state.block` persists across lines for /* … *\/; `//` is only a
 * comment outside CSS, where it is not one.
 *
 * F4-minified deliberately measures the raw line instead: minified source has no
 * comments to strip, and a long trailing comment is its own readability problem.
 */
function stripComments(line, state, isStyle) {
	let out = "";
	let index = 0;
	let quote = null;

	while (index < line.length) {
		if (state.block) {
			const end = line.indexOf("*/", index);
			if (end === -1) return out;
			state.block = false;
			index = end + 2;
			continue;
		}
		if (state.html) {
			const end = line.indexOf("-->", index);
			if (end === -1) return out;
			state.html = false;
			index = end + 3;
			continue;
		}

		const char = line[index];

		if (quote) {
			out += char;
			if (char === "\\") {
				out += line[index + 1] ?? "";
				index += 2;
				continue;
			}
			if (char === quote) quote = null;
			index++;
			continue;
		}

		if (char === '"' || char === "'" || char === "`") {
			quote = char;
			out += char;
			index++;
			continue;
		}
		if (char === "/" && line[index + 1] === "*") {
			state.block = true;
			index += 2;
			continue;
		}
		if (!isStyle && char === "/" && line[index + 1] === "/") return out;
		if (line.startsWith("<!--", index)) {
			state.html = true;
			index += 4;
			continue;
		}

		out += char;
		index++;
	}
	return out;
}

/** Replaces every quoted string literal with a two-character placeholder. */
function collapseStringLiterals(line) {
	return line.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
}

function isTestFile(path) {
	return /(?:^|\/)(?:__tests__|__mocks__)\//.test(path) || /\.(?:test|spec)\.[cm]?[jt]s$/.test(path);
}

function matchesAllowlist(path, patterns) {
	if (!patterns) return false;
	return patterns.some((pattern) =>
		pattern.endsWith("/**") ? path.startsWith(pattern.slice(0, -2)) : path === pattern
	);
}

function git(args) {
	return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function gitOrNull(args) {
	try {
		return git(args);
	} catch {
		return null;
	}
}

const SCANNED_EXTENSIONS = new Set([".svelte", ".ts", ".css"]);

function extensionOf(path) {
	const dot = path.lastIndexOf(".");
	return dot === -1 ? "" : path.slice(dot);
}

/** Untracked-but-not-ignored files count: a brand new component starts life here. */
function untrackedSourceFiles() {
	return (gitOrNull(["ls-files", "--others", "--exclude-standard", "--", "src"]) ?? "").split("\n");
}

function resolveBaseRef() {
	for (const ref of ["origin/main", "main"]) {
		if (gitOrNull(["rev-parse", "--verify", "--quiet", ref])) return ref;
	}
	return null;
}

function collectFiles(mode) {
	if (mode === "staged") {
		const staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]).split("\n");
		return { files: staged, source: "staged files" };
	}
	if (mode === "all") {
		return {
			files: [...git(["ls-files", "--", "src"]).split("\n"), ...untrackedSourceFiles()],
			source: "all tracked files under src/"
		};
	}
	const base = resolveBaseRef();
	if (!base) {
		return {
			files: [...git(["ls-files", "--", "src"]).split("\n"), ...untrackedSourceFiles()],
			source: "all tracked files under src/ (no origin/main or main to diff against)"
		};
	}
	// merge-base, so a stale branch is not blamed for changes that landed on main.
	const mergeBase = (gitOrNull(["merge-base", base, "HEAD"]) ?? base).trim();
	const changed = git(["diff", "--name-only", "--diff-filter=ACMR", mergeBase]).split("\n");
	return {
		files: [...changed, ...untrackedSourceFiles()],
		source: `working tree vs ${base} (merge-base ${mergeBase.slice(0, 8)})`
	};
}

// --- scan ------------------------------------------------------------------

function scanFile(path) {
	const absolute = join(ROOT, path);
	const ext = extensionOf(path);
	const lines = readFileSync(absolute, "utf8").split("\n");
	const hits = [];

	// .css is style throughout; in .svelte only the <style> block counts, so a
	// Tailwind class in the markup is never mistaken for a CSS declaration.
	let inStyleBlock = false;
	const commentState = { block: false, html: false };

	for (const [index, raw] of lines.entries()) {
		if (ext === ".svelte") {
			if (/<style[\s>]/.test(raw)) inStyleBlock = true;
			else if (/<\/style>/.test(raw)) inStyleBlock = false;
		}
		const isStyle = ext === ".css" || inStyleBlock;
		const code = stripComments(raw, commentState, isStyle);
		const ctx = { path, ext, isStyle, lineNumber: index + 1, raw };

		for (const rule of RULES) {
			if (matchesAllowlist(path, rule.exclude)) continue;
			if (rule.include && !rule.include(ctx)) continue;
			if (rule.test(code, ctx)) {
				hits.push({ rule, line: ctx.lineNumber, text: raw.trim() });
			}
		}
	}
	return hits;
}

function main() {
	const mode = process.argv.includes("--all")
		? "all"
		: process.argv.includes("--staged")
			? "staged"
			: "diff";

	const { files, source } = collectFiles(mode);

	const targets = [...new Set(files)]
		.map((path) => path.trim())
		.filter(Boolean)
		.filter((path) => path.startsWith("src/") && SCANNED_EXTENSIONS.has(extensionOf(path)))
		.filter((path) => existsSync(join(ROOT, path)) && statSync(join(ROOT, path)).isFile())
		.sort();

	const hitsByFile = new Map();
	let total = 0;
	for (const path of targets) {
		const hits = scanFile(path);
		if (hits.length > 0) {
			hitsByFile.set(path, hits);
			total += hits.length;
		}
	}

	console.log(`bans:check — scanning ${targets.length} file(s): ${source}`);

	if (total === 0) {
		console.log(`bans:check OK — ${RULES.length} rules, 0 violations`);
		return 0;
	}

	console.error(`\nbans:check FAILED — ${total} violation(s) in ${hitsByFile.size} file(s):\n`);
	const firedRules = new Map();
	for (const [path, hits] of hitsByFile) {
		for (const hit of hits) {
			firedRules.set(hit.rule.id, hit.rule.description);
			const excerpt = hit.text.length > 100 ? `${hit.text.slice(0, 100)}…` : hit.text;
			console.error(`  ${path}:${hit.line}  [${hit.rule.id}]  ${excerpt}`);
		}
	}
	console.error("");
	for (const [id, description] of firedRules) {
		console.error(`  ${id} — ${description}\n`);
	}
	console.error("See SPEC.md §1 (hard bans) and §8.1 for why each of these exists.\n");
	return 1;
}

// Guarded so RULES can be imported — by the self-test, or by an editor
// integration — without the scan running as an import side effect.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	process.exit(main());
}
