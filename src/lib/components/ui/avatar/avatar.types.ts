/**
 * Type-level contract for Avatar and AvatarGroup (SPEC.md §3.5, §7.4).
 *
 * §3.4 grants Avatar `gradient` (fallback background), `glow` (presence state),
 * `shimmer` (loading) and `tilt` (size ≥ lg). AvatarGroup's children get
 * `gradient` and `shimmer` only — a fanned stack of overlapping circles is the
 * last place a pointer-tracked effect belongs.
 */
import type { ComponentProps } from 'svelte';
import * as Avatar from './index.js';
import type AvatarRoot from './avatar.svelte';
import type AvatarGroupRoot from './avatar-group.svelte';

type Props = ComponentProps<typeof AvatarRoot>;
type GroupProps = ComponentProps<typeof AvatarGroupRoot>;

/*
 * All six upstream pieces are still here. This is the same regression test as
 * `card.types.ts`: the prior attempt collapsed multi-part components into
 * monoliths and silently deleted sub-components from the API (SPEC.md §8, `F1`).
 */
const parts = [
	Avatar.Root,
	Avatar.Image,
	Avatar.Fallback,
	Avatar.Badge,
	Avatar.Group,
	Avatar.GroupCount
] as const;

/* Upstream call sites, unchanged. */
const upstream: Props = {};

/* The effects the matrix grants, with their conditions. */
const tilted: Props = { size: 'lg',  };
const present: Props = { presence: 'online', glow: true };
const loading: Props = { shimmer: true };
const gradientFallback: Props = { gradient: true };

const group: GroupProps = {};

/* Magnet is for isolated CTAs. An avatar is neither isolated nor a CTA. */
// @ts-expect-error §3.4 grants Avatar no magnet
const magnetic: Props = { magnet: true };

export {
	parts,
	upstream,
	tilted,
	present,
	loading,
	gradientFallback,
	group,
	magnetic
};
