/**
 * Type-level contract for Tabs (SPEC.md §3.5, §7.4).
 *
 * `@ts-expect-error` inverts the check: if a forbidden prop ever *starts*
 * compiling, this file stops compiling and the regression is caught here rather
 * than in a review six components later. Nothing imports it at runtime; it
 * exists to be type-checked.
 *
 * §3.4's row for Tabs reads `ghost ● · gradient — · glow — · shimmer — · tilt —
 * · magnet —`. So there is exactly one thing to allow and five to forbid, and
 * "ghost" here is not a prop: it is the transparent-surface *variant*, which is
 * what `line` (and, on the added pair, `chrome`) already is. §3.1 is explicit
 * that ghost "is a **variant**, not an effect — lives in the variant enum".
 */
import type { TabsListProps, TabsProps, TabsTriggerProps } from './index.js';
import * as Tabs from './index.js';

/*
 * All four upstream pieces are still here, under both export names. The prior
 * attempt collapsed multi-part components into monoliths and silently deleted
 * sub-components (SPEC.md §8, `F1`); this assertion is the regression test for
 * that specific failure, in the same shape `card.types.ts` uses.
 */
const parts = [Tabs.Root, Tabs.List, Tabs.Trigger, Tabs.Content] as const;
const aliases = [Tabs.Tabs, Tabs.TabsList, Tabs.TabsTrigger, Tabs.TabsContent] as const;

/* Upstream call sites must keep compiling unchanged (SPEC.md §1, §7). */
const upstreamRoot: TabsProps = { value: 'overview' };
const upstreamList: TabsListProps = {};
const upstreamLineList: TabsListProps = { variant: 'line' };
const upstreamTrigger: TabsTriggerProps = { value: 'overview' };

/* The two variants §5 names, added without removing either upstream one. */
const chromeList: TabsListProps = { variant: 'chrome' };
const gooeyList: TabsListProps = { variant: 'gooey' };

/* Orientation and activation mode are bits-ui's, named explicitly by Root. */
const verticalRoot: TabsProps = { orientation: 'vertical', activationMode: 'manual' };

/*
 * The five effects §3.4 withholds. Tabs is application chrome: a glow would
 * claim "highest-intent target on this surface" for a navigation control, a
 * tilt would create a containing block under anything the panel portals, and an
 * idle shimmer on a tab strip is the migraine §3.5 names. None of them is a prop.
 */
// @ts-expect-error §3.4 gives Tabs no gradient
const gradientList: TabsListProps = { gradient: true };
// @ts-expect-error §3.4 gives Tabs no glow; the source's cursor-light on the letters is one (A20)
const glowList: TabsListProps = { glow: true };
// @ts-expect-error §3.4 gives Tabs no shimmer; an idle loop is loading, or it is a migraine (§3.5)
const shimmerList: TabsListProps = { shimmer: true };
// @ts-expect-error §3.4 gives Tabs no tilt; a tilting tab strip anchors every portal wrongly (§3.5)
const tiltList: TabsListProps = { tilt: true };
// @ts-expect-error §3.4 gives Tabs no magnet; magnet is never in application chrome (§3.5)
const magnetList: TabsListProps = { magnet: true };

/* A variant that does not exist must not be reachable through the enum either. */
// @ts-expect-error `neon` is a vuesax skin we did not port (§5 lists two additions, not six)
const neonList: TabsListProps = { variant: 'neon' };

export {
	parts,
	aliases,
	upstreamRoot,
	upstreamList,
	upstreamLineList,
	upstreamTrigger,
	chromeList,
	gooeyList,
	verticalRoot,
	gradientList,
	glowList,
	shimmerList,
	tiltList,
	magnetList,
	neonList
};
