/**
 * Type-level contract for Card (SPEC.md §3.5, §7.4).
 *
 * Card has no mutually exclusive *variant* pair the way Button and Badge do —
 * its `◐` conditions (`gradient` needs `variant="hero"`, `glow` needs
 * `interactive`) are runtime conditions passed to `FxContext.resolve`, because a
 * card can become interactive at runtime. What is checkable here is the shape of
 * the API: the sub-components still exist, and effects the matrix withholds are
 * not props.
 */
import type { CardProps } from './card.svelte';
import * as Card from './index.js';

/* Upstream call sites must keep compiling unchanged. */
const upstreamDefault: CardProps = {};
const upstreamSmall: CardProps = { size: 'sm' };

/*
 * All seven upstream pieces are still here. The prior attempt collapsed them
 * into one component and silently deleted `<Card.Header>` (SPEC.md §8, `F1`),
 * so this assertion is the regression test for that specific failure.
 */
const parts = [
	Card.Root,
	Card.Header,
	Card.Title,
	Card.Description,
	Card.Content,
	Card.Footer,
	Card.Action
] as const;

/* Effects the capability matrix allows. */
const hero: CardProps = { variant: 'hero', gradient: true };
const interactiveGlow: CardProps = { interactive: true, glow: true };
const tilted: CardProps = { tilt: true };

/* §3.4 gives Card no ghost, no shimmer and no magnet. */
// @ts-expect-error a card is a surface; transparency is not one of its states
const ghost: CardProps = { variant: 'ghost' };
// @ts-expect-error shimmer belongs to loading states, not to card surfaces
const shimmering: CardProps = { shimmer: true };
// @ts-expect-error magnet is for isolated CTAs only
const magnetic: CardProps = { magnet: true };

export { upstreamDefault, upstreamSmall, parts, hero, interactiveGlow, tilted, ghost, shimmering, magnetic };
