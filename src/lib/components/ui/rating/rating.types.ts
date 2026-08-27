/**
 * Type-level contract for Rating (SPEC.md §3.5, §7.4).
 *
 * SPEC.md §3.4 has **no Rating row**, which per the matrix's own note ("Components
 * not listed here are allowed no decorative effects at all — by design, not by
 * omission") means all five effects are withheld. §7.4 makes that an acceptance
 * criterion, and a doc comment is not a criterion, so each one is asserted below
 * as a compile error.
 *
 * Every directive was verified to be load-bearing by temporarily adding a
 * redundant one and confirming `svelte-check` reports "Unused '@ts-expect-error'
 * directive" for the extra copy.
 *
 * Nothing imports this at runtime; `registry.config.mjs` keeps `*.types.ts` out
 * of what ships to a consumer.
 */
import type { RatingProps } from './rating.svelte';

/* The structural surface. Rating is not generic in a variant: it has no effect
   props to condition, so there is nothing for a generic to key off. */
const plain: RatingProps = {};
const average: RatingProps = { value: 3.7, readonly: true, showValue: true };
const halves: RatingProps = { allowHalf: true, max: 5, value: 2.5 };
const emoji: RatingProps = { variant: 'emoji', size: 'sm', max: 5 };
const inForm: RatingProps = { name: 'zufriedenheit', required: true, state: 'danger' };
const off: RatingProps = { disabled: true, value: 0 };

/* bits-ui's own surface stays reachable: this is a superset of RatingGroup.Root. */
const vertical: RatingProps = { orientation: 'vertical', min: 0, onValueChange: () => {} };
const named: RatingProps = { 'aria-label': 'Bewertung des Produkts' };

/*
 * The five effects, all withheld. These props must not exist at all — not be
 * accepted and ignored.
 */
// @ts-expect-error §3.4 has no Rating row, so no gradient
const gradient: RatingProps = { gradient: true };
// @ts-expect-error §3.4 has no Rating row; the source's 90px star glow is declined by A23
const glow: RatingProps = { glow: true };
// @ts-expect-error §3.4 has no Rating row; the glow skin's 2.4s halo is an idle loop (§3.5)
const shimmer: RatingProps = { shimmer: true };
// @ts-expect-error §3.4 has no Rating row; a star is not an object you pick up
const tilt: RatingProps = { tilt: true };
// @ts-expect-error §3.4 has no Rating row; §3.5 forbids magnet in a form outright
const magnet: RatingProps = { magnet: true };

export {
	plain,
	average,
	halves,
	emoji,
	inForm,
	off,
	vertical,
	named,
	gradient,
	glow,
	shimmer,
	tilt,
	magnet
};
