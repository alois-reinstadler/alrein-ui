/**
 * Type-level contract for Button, checked by `svelte-check`.
 *
 * SPEC.md §3.5 requires the mutual exclusions to be **type errors, not doc
 * comments**, and §7.4 makes that an acceptance criterion. `@ts-expect-error`
 * inverts the check: if one of the forbidden combinations ever stops being an
 * error, this file fails to compile and the regression is caught here rather
 * than in a review six components later.
 *
 * Nothing imports this at runtime; it exists to be type-checked.
 */
import type { ButtonProps } from './button.svelte';

/*
 * `ButtonProps` is generic in the variant, so a props *object* has to name it —
 * `ButtonProps<'ghost'>`. In markup the generic is inferred from the `variant`
 * attribute and nobody writes it; `button.call-sites.svelte` covers that path,
 * which is the one that actually has to work.
 */

/* Upstream call sites must keep compiling unchanged (SPEC.md §1, §7). */
const upstreamDefault: ButtonProps = {};
const upstreamDestructive: ButtonProps<'destructive'> = { variant: 'destructive', size: 'sm' };
const upstreamGhostIcon: ButtonProps<'ghost'> = { variant: 'ghost', size: 'icon' };
const upstreamLink: ButtonProps<'link'> = { variant: 'link', href: '/somewhere' };
const upstreamIconXs: ButtonProps<'outline'> = { variant: 'outline', size: 'icon-xs' };

/* Effects the capability matrix allows. */
const glowing: ButtonProps = { glow: true };
const gradientTilt: ButtonProps = { gradient: true, tilt: true };
const secondaryGlow: ButtonProps<'secondary'> = { variant: 'secondary', glow: true, gradient: false };
const ghostShimmer: ButtonProps<'ghost'> = { variant: 'ghost', shimmer: true };
const magneticCta: ButtonProps = { magnet: true, size: 'lg' };

/* A transparent surface has nothing to paint. */
// @ts-expect-error ghost + gradient is a contradiction (SPEC.md §3.5)
const ghostGradient: ButtonProps<'ghost'> = { variant: 'ghost', gradient: true };
// @ts-expect-error ghost + glow has nothing to glow from (SPEC.md §3.5)
const ghostGlow: ButtonProps<'ghost'> = { variant: 'ghost', glow: true };
// @ts-expect-error link is transparent for the same reason as ghost
const linkGlow: ButtonProps<'link'> = { variant: 'link', glow: true };

/* Effects the matrix does not give Button at all must not exist as props. */
// @ts-expect-error Button has no `parallax` effect
const unknownEffect: ButtonProps = { parallax: true };

export type {};
export {
	upstreamDefault,
	upstreamDestructive,
	upstreamGhostIcon,
	upstreamLink,
	upstreamIconXs,
	glowing,
	gradientTilt,
	secondaryGlow,
	ghostShimmer,
	magneticCta,
	ghostGradient,
	ghostGlow,
	linkGlow,
	unknownEffect
};
