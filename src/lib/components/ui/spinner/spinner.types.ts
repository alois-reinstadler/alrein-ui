/**
 * Type-level contract for Spinner (SPEC.md §3.5, §7.4).
 *
 * §3.4 has no row for Spinner, and per the matrix's own note that means **no
 * decorative effects at all**. That is not an oversight: a spinner is a status
 * indicator, and decorating it competes with the thing it is saying.
 */
import type { SpinnerProps } from './spinner.svelte';

const plain: SpinnerProps = {};
const grid: SpinnerProps = { variant: 'grid', size: 'lg', speed: 'fast' };
const comet: SpinnerProps = { variant: 'comet', size: 'xl', speed: 'slow' };
const labelled: SpinnerProps = { label: 'Rechnung wird erstellt' };
const scrim: SpinnerProps = { overlay: true };

// @ts-expect-error §3.4 grants Spinner no glow
const glowing: SpinnerProps = { glow: true };
// @ts-expect-error §3.4 grants Spinner no gradient
const gradient: SpinnerProps = { gradient: true };
// @ts-expect-error §3.4 grants Spinner no tilt
const tilted: SpinnerProps = { tilt: true };
// @ts-expect-error §3.4 grants Spinner no magnet
const magnetic: SpinnerProps = { magnet: true };
/*
 * Shimmer is the one that looks arguable, and it is the clearest no: shimmer's
 * loop *means* loading, and so does a spinner. Two indicators of the same fact
 * on one element is not emphasis, it is noise.
 */
// @ts-expect-error §3.4 grants Spinner no shimmer
const shimmering: SpinnerProps = { shimmer: true };

export { plain, grid, comet, labelled, scrim, glowing, gradient, tilted, magnetic, shimmering };
