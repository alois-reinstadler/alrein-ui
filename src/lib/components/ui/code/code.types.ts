/**
 * Type-level contract for Code and CodeWindow (SPEC.md §3.5, §7.4).
 *
 * §3.4 has no row for either, which by the matrix's own convention means no
 * decorative effects. A syntax highlighter exists to make code readable, and
 * anything painted over it works against that.
 */
import type { CodeProps } from './code.svelte';
import type { CodeWindowProps } from './code-window.svelte';

const basic: CodeProps = { code: 'const x = 1;', lang: 'typescript' };
const captioned: CodeProps = { code: 'x', lang: 'bash', caption: 'install.sh' };
const numbered: CodeProps = { code: 'x', lang: 'css', lineNumbers: true, copyable: false };
const minimal: CodeProps = { code: 'x', variant: 'minimal' };

/* An unsupported language renders un-highlighted rather than failing to compile. */
const unknownLanguage: CodeProps = { code: 'x', lang: 'brainfuck' };

const window: CodeWindowProps = { code: 'x', lang: 'svelte', title: 'App.svelte' };
const plainWindow: CodeWindowProps = { code: 'x', traffic: false };

// @ts-expect-error §3.4 grants Code no glow
const glowing: CodeProps = { code: 'x', glow: true };
// @ts-expect-error a gradient behind code fights the syntax colours
const gradient: CodeProps = { code: 'x', gradient: true };
// @ts-expect-error §3.4 grants Code no shimmer
const shimmering: CodeProps = { code: 'x', shimmer: true };
// @ts-expect-error tilted code is code you cannot read
const tilted: CodeProps = { code: 'x', tilt: true };
// @ts-expect-error §3.4 grants Code no magnet
const magnetic: CodeProps = { code: 'x', magnet: true };
// @ts-expect-error CodeWindow inherits the same withholding
const windowGlow: CodeWindowProps = { code: 'x', glow: true };

export {
	basic,
	captioned,
	numbered,
	minimal,
	unknownLanguage,
	window,
	plainWindow,
	glowing,
	gradient,
	shimmering,
	tilted,
	magnetic,
	windowGlow
};
