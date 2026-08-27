/**
 * Type-level contract for Steps (SPEC.md §3.5, §7.4).
 *
 * §3.4 grants Steps `gradient` on the active step and nothing else.
 */
import type { StepsProps } from './steps.svelte';

const steps = [{ label: 'Konto' }, { label: 'Adresse' }, { label: 'Zahlung' }];

const basic: StepsProps = { steps, value: 1 };
const vertical: StepsProps = { steps, orientation: 'vertical' };
const arrow: StepsProps = { steps, variant: 'arrow' };
const emphasised: StepsProps = { steps, value: 1, gradient: true };

/*
 * A18: Steps is not a MorphIndicator consumer and has no sliding indicator, so
 * there is nothing here for a pointer-tracked effect to attach to either.
 */
// @ts-expect-error §3.4 grants Steps no glow
const glowing: StepsProps = { steps, glow: true };
// @ts-expect-error §3.4 grants Steps no shimmer
const shimmering: StepsProps = { steps, shimmer: true };
// @ts-expect-error §3.4 grants Steps no tilt
const tilted: StepsProps = { steps, tilt: true };
// @ts-expect-error §3.4 grants Steps no magnet
const magnetic: StepsProps = { steps, magnet: true };

export { basic, vertical, arrow, emphasised, glowing, shimmering, tilted, magnetic };
