/**
 * Lazy syntax highlighting for `Code` and `CodeWindow` (SPEC.md A27).
 *
 * Shiki is the right highlighter and it is heavy — the full bundle is megabytes
 * of TextMate grammars. Three things keep it off the critical path:
 *
 * 1. **`shiki/bundle/web`**, not the full bundle.
 * 2. **A dynamic `import()`**, so nothing is fetched until a code block actually
 *    mounts. A page with no code costs nothing.
 * 3. **An explicit language allowlist.** Shiki loads a grammar per language; an
 *    open-ended set means an open-ended download.
 *
 * The SSR render is a plain, correctly escaped `<pre><code>`. That is not a
 * degraded mode — it means the code is readable, selectable and copyable before
 * any highlighting arrives, and stays that way if it never does.
 */

/**
 * The languages we ship grammars for.
 *
 * Deliberately short. Adding one is a deliberate act with a download attached,
 * which is the point: an open-ended list is how a 40 KB component becomes a
 * 2 MB one without anybody deciding to.
 */
export const LANGUAGES = [
	'bash',
	'css',
	'diff',
	'html',
	'javascript',
	'json',
	'jsx',
	'markdown',
	'python',
	'sql',
	'svelte',
	'tsx',
	'typescript',
	'yaml'
] as const;

export type CodeLanguage = (typeof LANGUAGES)[number];

/** The two themes, one per colour scheme. Shiki emits both and CSS picks. */
export const THEMES = { light: 'github-light', dark: 'github-dark' } as const;

export function isSupportedLanguage(value: string): value is CodeLanguage {
	return (LANGUAGES as readonly string[]).includes(value);
}

/**
 * Escapes text for the `<pre>` fallback.
 *
 * This runs on the server and on every unhighlighted render, so it is the
 * difference between a code block and an injection. `F13` bans `innerHTML` in
 * components for exactly this class of reason; here the highlighted output
 * *must* be inserted as HTML because that is what a highlighter produces, so the
 * un-highlighted path has to be provably safe on its own.
 */
export function escapeHtml(source: string): string {
	return source
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * One highlighter for the page, created on first use.
 *
 * The type comes from Shiki rather than being hand-written, so a change to its
 * signature is a compile error here instead of a runtime surprise. It is
 * imported with `import type`, which erases entirely — the lazy `import()`
 * below stays the only thing that pulls any of Shiki's weight.
 */
type Highlighter = Awaited<ReturnType<typeof import('shiki/bundle/web').createHighlighter>>;

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
	highlighterPromise ??= import('shiki/bundle/web').then((shiki) =>
		shiki.createHighlighter({
			themes: [THEMES.light, THEMES.dark],
			langs: [...LANGUAGES]
		})
	);
	return highlighterPromise;
}

/**
 * Highlights to HTML, or returns `null` if it cannot.
 *
 * `null` rather than a throw: a highlighter that fails to load is not a reason
 * to lose the code. The caller keeps showing its escaped `<pre>`.
 */
export async function highlight(code: string, lang: string): Promise<string | null> {
	if (!isSupportedLanguage(lang)) return null;
	try {
		const highlighter = await getHighlighter();
		return highlighter.codeToHtml(code, {
			lang,
			themes: THEMES,
			defaultColor: false
		});
	} catch {
		return null;
	}
}
