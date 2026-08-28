/**
 * Type-level contract for Checkbox (SPEC.md §3.5, §7.4).
 *
 * §3.4 gives a bare checkbox no decorative effects and the card presentation
 * gradient (selected), glow (selected) and tilt. The card-only props must
 * therefore not exist on the default variant.
 */
import type { CheckboxProps } from './checkbox.svelte';

/* Upstream call sites must keep compiling unchanged. */
const upstream: CheckboxProps = {};
const upstreamChecked: CheckboxProps = { checked: true };
const upstreamIndeterminate: CheckboxProps = { indeterminate: true, disabled: true };

/* The card presentation and the effects §3.4 allows on it. */
const card: CheckboxProps = { variant: 'card' };
const cardSelected: CheckboxProps = { variant: 'card', gradient: true, glow: true };

/* A 16px box has nothing to glow from. */
/* A31: cursor-following tilt belongs to Card alone, so the prop is gone entirely. */
// @ts-expect-error Checkbox has no `tilt` prop (A31)
const retiredTilt: CheckboxProps = { variant: 'card', tilt: true };
// @ts-expect-error glow is a card-only effect
const bareGlow: CheckboxProps = { glow: true };
// @ts-expect-error gradient is a card-only effect
const bareGradient: CheckboxProps = { variant: 'default', gradient: true };
// @ts-expect-error the label snippet only has a surface to sit on in card form
const bareLabel: CheckboxProps = { label: () => undefined };

/* §3.4 gives the card no shimmer and no magnet. */
// @ts-expect-error shimmer belongs to loading states
const shimmering: CheckboxProps = { variant: 'card', shimmer: true };
// @ts-expect-error magnet is for isolated CTAs only, never in a form
const magnetic: CheckboxProps = { variant: 'card', magnet: true };

export {
	upstream,
	upstreamChecked,
	upstreamIndeterminate,
	card,
	cardSelected,
	retiredTilt,
	bareGlow,
	bareGradient,
	bareLabel,
	shimmering,
	magnetic
};
