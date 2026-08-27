/**
 * Type-level contract for Chip (SPEC.md §3.5, §7.4).
 *
 * SPEC.md §3.5 requires the mutual exclusions to be **type errors, not doc
 * comments**, and §7.4 makes "effect props exist only where §3.4 allows them" an
 * acceptance criterion. `@ts-expect-error` inverts the check: the day one of
 * these stops being an error, this file fails to compile and the regression is
 * caught here rather than in a review six components later.
 *
 * Every directive below was verified to be load-bearing by temporarily adding a
 * redundant one and confirming `svelte-check` reports "Unused '@ts-expect-error'
 * directive" for the extra copy.
 *
 * Nothing imports this at runtime; it exists to be type-checked, and
 * `registry.config.mjs` keeps `*.types.ts` out of what ships to a consumer.
 */
import type { ChipProps } from './chip.svelte';

/*
 * `ChipProps` is generic in the variant, so a props *object* has to name it —
 * `ChipProps<'ghost'>`. In markup the generic is inferred from the `variant`
 * attribute and nobody writes it; `chip.call-sites.svelte` covers that path,
 * which is the one that actually has to work.
 */

/* Every variant, at rest. */
const soft: ChipProps = {};
const solid: ChipProps<'solid'> = { variant: 'solid' };
const outline: ChipProps<'outline'> = { variant: 'outline' };
const ghost: ChipProps<'ghost'> = { variant: 'ghost' };

/* The structural extension: selection and removal, on any variant. */
const selectableOutline: ChipProps<'outline'> = { variant: 'outline', selectable: true, selected: true };
const removable: ChipProps = { removable: true, onremove: () => {}, removeLabel: 'Filter entfernen' };
const small: ChipProps = { size: 'sm', dot: true, disabled: true };

/* The one effect §3.4 grants Chip, on the variants that paint a surface. */
const softGradient: ChipProps = { gradient: true };
const solidGradient: ChipProps<'solid'> = { variant: 'solid', gradient: true };

/* A transparent surface has nothing to paint over. */
// @ts-expect-error ghost + gradient is a contradiction (SPEC.md §3.5)
const ghostGradient: ChipProps<'ghost'> = { variant: 'ghost', gradient: true };
// @ts-expect-error outline is a bordered transparent surface; a gradient erases the border
const outlineGradient: ChipProps<'outline'> = { variant: 'outline', gradient: true };

/*
 * §3.4's Chip row is `ghost ●` and `gradient ●` and nothing else. The four
 * withheld effects must not exist as props at all — not accepted and ignored.
 */
// @ts-expect-error §3.4 gives Chip no glow: a chip sits in a dense row and an outer bleed there is noise
const glowing: ChipProps = { glow: true };
// @ts-expect-error §3.4 gives Chip no shimmer; the source's 1.9s pulse-while-selected is an idle loop (§3.5)
const shimmering: ChipProps = { shimmer: true };
// @ts-expect-error §3.4 gives Chip no tilt: a chip is a label, not an object you pick up
const tilted: ChipProps = { tilt: true };
// @ts-expect-error §3.4 gives Chip no magnet; §3.5 forbids magnet in a list outright
const magnetic: ChipProps = { magnet: true };

export {
	soft,
	solid,
	outline,
	ghost,
	selectableOutline,
	removable,
	small,
	softGradient,
	solidGradient,
	ghostGradient,
	outlineGradient,
	glowing,
	shimmering,
	tilted,
	magnetic
};
