/**
 * Type-level contract for Timeline (SPEC.md §3.5, §7.4).
 *
 * §3.4 has no row for Timeline, which by the matrix's own convention means no
 * decorative effects at all. A timeline is a record of what happened, and
 * emphasis on a past event is emphasis on nothing actionable.
 */
import type { TimelineProps } from './timeline.svelte';

const entries = [
	{ title: 'Bestellung eingegangen', time: '09:12' },
	{ title: 'Bezahlt', time: '09:14', tone: 'success' as const },
	{ title: 'Versandt', time: '11:40' }
];

const basic: TimelineProps = { entries };
const compact: TimelineProps = { entries, variant: 'compact' };
const partial: TimelineProps = { entries, progress: 1.5 };

// @ts-expect-error §3.4 grants Timeline no glow
const glowing: TimelineProps = { entries, glow: true };
// @ts-expect-error §3.4 grants Timeline no gradient
const gradient: TimelineProps = { entries, gradient: true };
// @ts-expect-error §3.4 grants Timeline no shimmer
const shimmering: TimelineProps = { entries, shimmer: true };
// @ts-expect-error §3.4 grants Timeline no tilt
const tilted: TimelineProps = { entries, tilt: true };
// @ts-expect-error §3.4 grants Timeline no magnet
const magnetic: TimelineProps = { entries, magnet: true };

export { basic, compact, partial, glowing, gradient, shimmering, tilted, magnetic };
