/**
 * Type-level contract for Button, checked by `svelte-check`.
 *
 * SPEC.md §3.5 requires the mutual exclusions to be **type errors, not doc
 * comments**, and §7.4 makes that an acceptance criterion. `@ts-expect-error`
 * inverts the check: if one of the forbidden combinations ever stops being an
 * error, this file fails to compile and the regression is caught here rather
 * than in a review six components later.
 *
 * ## What A31 changed here
 *
 * `gradient`, `glow` and `shimmer` are variants now, not effect props, so the
 * contradictions this file used to assert are **unrepresentable** rather than
 * rejected: you cannot pass `variant="ghost"` and `variant="gradient"` at once
 * because they are the same field. The `@ts-expect-error` cases that policed
 * `ghost + gradient` are gone with the props they policed — an assertion that a
 * non-existent prop is rejected tests nothing.
 *
 * What is still worth asserting is that the props really are gone, that the
 * variant union is closed, and that `magnet` survived as a boolean.
 *
 * `ButtonProps` is also no longer generic: with one unconditional effect prop
 * left there is no variant-keyed conditional type to parameterise.
 *
 * Nothing imports this at runtime; it exists to be type-checked.
 */
import type { ButtonProps } from './button.svelte';

/* Upstream call sites must keep compiling unchanged (SPEC.md §1, §7). */
const upstreamDefault: ButtonProps = {};
const upstreamDestructive: ButtonProps = { variant: 'destructive', size: 'sm' };
const upstreamGhostIcon: ButtonProps = { variant: 'ghost', size: 'icon' };
const upstreamLink: ButtonProps = { variant: 'link', href: '/somewhere' };
const upstreamIconXs: ButtonProps = { variant: 'outline', size: 'icon-xs' };

/* A31: the three surface treatments are variants. */
const gradientCta: ButtonProps = { variant: 'gradient' };
const glowingCta: ButtonProps = { variant: 'glow', size: 'lg' };
const shimmeringCta: ButtonProps = { variant: 'shimmer' };

/* The one effect prop left, and it composes with any variant. */
const magneticCta: ButtonProps = { magnet: true, size: 'lg' };
const magneticGradient: ButtonProps = { variant: 'gradient', magnet: true };

/* The §5 progress state is not an effect and takes a number. */
const uploading: ButtonProps = { progress: 0.42 };

/*
 * The contradictions §3.5 named are now structural. `ghost` and `gradient` are
 * two values of one field, so this is a plain union error rather than a
 * conditional-type one — but it is still the error, and it still has to fire.
 */
// @ts-expect-error a button is one variant, not two
const ghostAndGradient: ButtonProps = { variant: 'ghost gradient' };
// @ts-expect-error the variant union is closed
const inventedVariant: ButtonProps = { variant: 'neon' };

/* The retired props must not quietly come back as `any`. */
// @ts-expect-error `gradient` is a variant now, not a prop (A31)
const retiredGradient: ButtonProps = { gradient: true };
// @ts-expect-error `glow` is a variant now, not a prop (A31)
const retiredGlow: ButtonProps = { glow: true };
// @ts-expect-error `shimmer` is a variant now, not a prop (A31)
const retiredShimmer: ButtonProps = { shimmer: true };
/* Cursor-following tilt belongs to Card alone; Button tips on press instead. */
// @ts-expect-error Button has no `tilt` prop (A31, A10a)
const retiredTilt: ButtonProps = { tilt: true };

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
	gradientCta,
	glowingCta,
	shimmeringCta,
	magneticCta,
	magneticGradient,
	uploading,
	ghostAndGradient,
	inventedVariant,
	retiredGradient,
	retiredGlow,
	retiredShimmer,
	retiredTilt,
	unknownEffect
};
