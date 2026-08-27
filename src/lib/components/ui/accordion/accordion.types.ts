/**
 * Type-level contract for Accordion (SPEC.md §3.5, §7.4).
 *
 * SPEC.md §3.5 requires the capability matrix to be enforced in the *types*, not
 * in a doc comment, and §7.4 makes that an acceptance criterion.
 * `@ts-expect-error` inverts the check: if one of the forbidden props ever stops
 * being an error, this file fails to compile and the regression is caught here
 * rather than in a review six components later.
 *
 * Nothing imports this at runtime; it exists to be type-checked.
 */
import type { AccordionProps } from './accordion.svelte';
import type { AccordionTriggerProps } from './accordion-trigger.svelte';
import * as Accordion from './index.js';

/*
 * All four upstream pieces are still here under their upstream names. The prior
 * attempt's worst failure was collapsing a multi-part component into one
 * monolith and silently deleting its sub-components (SPEC.md §8, `F1`), so this
 * assertion is the direct regression test for it.
 */
const parts = [Accordion.Root, Accordion.Item, Accordion.Trigger, Accordion.Content] as const;

/* Upstream call sites must keep compiling unchanged (SPEC.md §1, §7). */
const upstreamSingle: AccordionProps = { type: 'single' };
const upstreamMultiple: AccordionProps = { type: 'multiple', value: ['a', 'b'] };
const upstreamDisabled: AccordionProps = { type: 'single', disabled: true };
const upstreamTrigger: AccordionTriggerProps = { level: 2 };

/* The variant §3.4 grants (`ghost ●`) and the two effects (`gradient ◐`, `glow ◐`). */
const ghostRoot: AccordionProps = { type: 'single', variant: 'ghost' };
const gradientHeader: AccordionTriggerProps = { gradient: true };
const glowingTrigger: AccordionTriggerProps = { glow: true };

/*
 * §3.4 gives Accordion no shimmer, no tilt and no magnet — an accordion header
 * is application chrome, and a header that tilts hosts nothing you can pick up.
 */
// @ts-expect-error shimmer belongs to loading states, not to a disclosure header
const shimmeringTrigger: AccordionTriggerProps = { shimmer: true };
// @ts-expect-error tilt creates a containing block for fixed positioning (§3.5)
const tiltedTrigger: AccordionTriggerProps = { tilt: true };
// @ts-expect-error magnet is for isolated CTAs only, never in chrome
const magneticTrigger: AccordionTriggerProps = { magnet: true };

/*
 * The `◐ header only` / `◐ trigger` conditions are structural: the effects are
 * props of the trigger, and the root does not have them at all. That is the
 * scoping the source gets wrong — it puts its glow layer on the whole item and
 * lights the open panel with it.
 */
// @ts-expect-error gradient is header-only, so it is not a root prop
const gradientRoot: AccordionProps = { type: 'single', gradient: true };
// @ts-expect-error glow is trigger-only, so it is not a root prop
const glowRoot: AccordionProps = { type: 'single', glow: true };

export {
	parts,
	upstreamSingle,
	upstreamMultiple,
	upstreamDisabled,
	upstreamTrigger,
	ghostRoot,
	gradientHeader,
	glowingTrigger,
	shimmeringTrigger,
	tiltedTrigger,
	magneticTrigger,
	gradientRoot,
	glowRoot
};
