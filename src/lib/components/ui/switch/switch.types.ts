/**
 * Type-level contract for Switch, checked by `svelte-check`.
 *
 * Same purpose as `button.types.ts`: SPEC.md §3.5 requires the capability
 * matrix to be enforced in the prop types rather than in a doc comment, and
 * `@ts-expect-error` is what makes a regression fail the build instead of a
 * review. The rest asserts the strict-superset promise (§1) — every upstream
 * shadcn-svelte call site still type-checks.
 *
 * Nothing imports this at runtime; it exists to be type-checked.
 */
import type { Snippet } from 'svelte';
import type { SwitchProps } from './switch.svelte';

declare const labelSnippet: Snippet;

/* ------------------------------------------------------------------ */
/* Upstream call sites must keep compiling unchanged (§1, §7).         */
/* ------------------------------------------------------------------ */

const upstreamBare: SwitchProps = {};
const upstreamSized: SwitchProps = { size: 'sm' };
const upstreamChecked: SwitchProps = { checked: true, onCheckedChange: () => {} };
const upstreamForm: SwitchProps = { name: 'benachrichtigungen', value: 'an', required: true };
const upstreamDisabled: SwitchProps = { disabled: true, class: 'ml-2', id: 'notify' };
const upstreamInvalid: SwitchProps = { 'aria-invalid': true };

/* ------------------------------------------------------------------ */
/* What the superset adds: the §5 collapse of switch-dot + switch-label. */
/* ------------------------------------------------------------------ */

const labelled: SwitchProps = { label: labelSnippet };
const labelledDisabled: SwitchProps = { label: labelSnippet, disabled: true, size: 'sm' };

/* The label is a snippet, not a string — rich content has to be possible, and
 * a string prop would be a second, weaker API for the same slot. */
// @ts-expect-error `label` is a Snippet, not a string
const stringLabel: SwitchProps = { label: 'Benachrichtigungen' };

/*
 * `onLabel` / `offLabel` were considered and are deliberately not props. The
 * track is 32×18.4px (24×14px at `sm`) around a 16px thumb, so nothing legible
 * fits beside it, and widening the track to make room is an effect that changes
 * the layout box — banned by §1. Skipped rather than shipped illegible.
 */
// @ts-expect-error in-track labels do not exist; see switch.svelte
const inTrackLabels: SwitchProps = { onLabel: labelSnippet, offLabel: labelSnippet };

/* ------------------------------------------------------------------ */
/* Effects §3.4 does not give a form control must not exist as props.  */
/* ------------------------------------------------------------------ */

// @ts-expect-error Switch has no glow (§3.4; §3.5 forbids glow on form fields)
const glowing: SwitchProps = { glow: true };
// @ts-expect-error Switch has no tilt (§3.4)
const tilting: SwitchProps = { tilt: true };
// @ts-expect-error Switch has no shimmer (§3.4)
const shimmering: SwitchProps = { shimmer: true };
// @ts-expect-error Switch has no gradient (§3.4)
const gradient: SwitchProps = { gradient: true };
// @ts-expect-error magnet is never in a form (§3.5)
const magnetic: SwitchProps = { magnet: true };

export type {};
export {
	upstreamBare,
	upstreamSized,
	upstreamChecked,
	upstreamForm,
	upstreamDisabled,
	upstreamInvalid,
	labelled,
	labelledDisabled,
	stringLabel,
	inTrackLabels,
	glowing,
	tilting,
	shimmering,
	gradient,
	magnetic
};
