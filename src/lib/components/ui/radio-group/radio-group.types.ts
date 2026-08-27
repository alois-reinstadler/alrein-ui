/**
 * Type-level contract for RadioGroupItem (SPEC.md §3.5, §7.4). Mirrors
 * Checkbox: the effect props exist only on the card presentation.
 */
import type { RadioGroupItemProps } from './radio-group-item.svelte';

/* Upstream call sites must keep compiling unchanged. */
const upstream: RadioGroupItemProps = { value: 'a' };
const upstreamDisabled: RadioGroupItemProps = { value: 'b', disabled: true };

/* The card presentation and the effects §3.4 allows on it. */
const card: RadioGroupItemProps = { value: 'c', variant: 'card' };
const cardTilt: RadioGroupItemProps = { value: 'd', variant: 'card', tilt: true };
const cardSelected: RadioGroupItemProps = { value: 'e', variant: 'card', gradient: true, glow: true };

/* A 16px dot has nothing to glow from and nothing to tilt. */
// @ts-expect-error tilt is a card-only effect (SPEC.md §3.4)
const bareTilt: RadioGroupItemProps = { value: 'f', tilt: true };
// @ts-expect-error glow is a card-only effect
const bareGlow: RadioGroupItemProps = { value: 'g', glow: true };
// @ts-expect-error the label snippet only has a surface to sit on in card form
const bareLabel: RadioGroupItemProps = { value: 'h', label: () => undefined };

/* §3.4 gives the card no shimmer and no magnet. */
// @ts-expect-error shimmer belongs to loading states
const shimmering: RadioGroupItemProps = { value: 'i', variant: 'card', shimmer: true };
// @ts-expect-error magnet is for isolated CTAs only, never in a form
const magnetic: RadioGroupItemProps = { value: 'j', variant: 'card', magnet: true };

export {
	upstream,
	upstreamDisabled,
	card,
	cardTilt,
	cardSelected,
	bareTilt,
	bareGlow,
	bareLabel,
	shimmering,
	magnetic
};
