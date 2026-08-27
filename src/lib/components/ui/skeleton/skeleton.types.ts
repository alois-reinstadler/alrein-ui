/**
 * Type-level contract for Skeleton (SPEC.md §3.5, §7.4).
 *
 * §3.4 grants Skeleton `shimmer` and nothing else, and it is the one component
 * in Phase 2 whose source needs no decline: vuesax applies nothing beyond the
 * matrix here either.
 */
import type { ComponentProps } from 'svelte';
import type Skeleton from './skeleton.svelte';
import type SkeletonGroup from './skeleton-group.svelte';

type Props = ComponentProps<typeof Skeleton>;
type GroupProps = ComponentProps<typeof SkeletonGroup>;

/* Upstream is one div with three classes; it must keep working untouched. */
const upstream: Props = {};
const sized: Props = { class: 'h-4 w-32' };

/* The one effect the matrix grants. */
const shimmering: Props = { shimmer: true };
const both: Props = { shimmer: true, pulse: true };

const group: GroupProps = {};
const labelledGroup: GroupProps = { label: 'Bericht wird geladen' };

/*
 * The four withheld effects. A skeleton is a placeholder for content that does
 * not exist yet — there is nothing to emphasise, nothing to pick up, and no
 * intent to signal.
 */
// @ts-expect-error §3.4 grants Skeleton no glow
const glowing: Props = { glow: true };
// @ts-expect-error §3.4 grants Skeleton no gradient
const gradient: Props = { gradient: true };
// @ts-expect-error §3.4 grants Skeleton no tilt
const tilted: Props = { tilt: true };
// @ts-expect-error §3.4 grants Skeleton no magnet
const magnetic: Props = { magnet: true };

export { upstream, sized, shimmering, both, group, labelledGroup, glowing, gradient, tilted, magnetic };
