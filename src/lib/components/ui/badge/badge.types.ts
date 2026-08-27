/**
 * Type-level contract for Badge (SPEC.md §3.5, §7.4). See button.types.ts for why
 * `@ts-expect-error` rather than a comment.
 */
import type { BadgeProps } from './badge.svelte';

/* Upstream call sites must keep compiling unchanged. */
const upstreamDefault: BadgeProps = {};
const upstreamSecondary: BadgeProps = { variant: 'secondary' };
const upstreamDestructive: BadgeProps = { variant: 'destructive' };
const upstreamOutline: BadgeProps = { variant: 'outline' };
const upstreamGhost: BadgeProps = { variant: 'ghost' };
const upstreamLinked: BadgeProps = { variant: 'link', href: '/somewhere' };

/* Effects the capability matrix allows. */
const promo: BadgeProps = { gradient: true };
const criticalGlow: BadgeProps = { variant: 'destructive', glow: true };
const ghostShimmer: BadgeProps = { variant: 'ghost', shimmer: true };

/* Transparent surfaces have nothing to paint or glow from. */
// @ts-expect-error ghost + gradient is a contradiction (SPEC.md §3.5)
const ghostGradient: BadgeProps = { variant: 'ghost', gradient: true };
// @ts-expect-error outline is a bordered transparent surface; a gradient erases the border
const outlineGradient: BadgeProps = { variant: 'outline', gradient: true };
// @ts-expect-error link has nothing to glow from
const linkGlow: BadgeProps = { variant: 'link', glow: true };

/* §3.4 gives Badge no tilt and no magnet, so the props must not exist. */
// @ts-expect-error Badge is a label, not an object you pick up
const tilted: BadgeProps = { tilt: true };
// @ts-expect-error magnet is for isolated CTAs only
const magnetic: BadgeProps = { magnet: true };

export {
	upstreamDefault,
	upstreamSecondary,
	upstreamDestructive,
	upstreamOutline,
	upstreamGhost,
	upstreamLinked,
	promo,
	criticalGlow,
	ghostShimmer,
	ghostGradient,
	outlineGradient,
	linkGlow,
	tilted,
	magnetic
};
