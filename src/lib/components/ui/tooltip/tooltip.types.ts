/**
 * Type-level contract for Tooltip, checked by `svelte-check`.
 *
 * Tooltip's row in SPEC.md §3.4 is empty across all six columns, so this file is
 * mostly one assertion repeated five times: **none of the effect props exist**.
 * §3.5 requires that to be a type error rather than a doc comment and §7.4 makes
 * it an acceptance criterion, so `@ts-expect-error` inverts the check — if one
 * of them ever becomes legal, this file stops compiling.
 *
 * The rest is the strict-superset promise (§1): every upstream shadcn-svelte
 * call site must still type-check against the extended component.
 *
 * Nothing imports this at runtime; it exists to be type-checked, and the
 * registry generator excludes `*.types.ts` from every item.
 */
import type { ComponentProps } from 'svelte';
import type { TooltipContentProps } from './tooltip-content.svelte';
import * as Tooltip from './index.js';

type TooltipRootProps = ComponentProps<typeof Tooltip.Root>;
type TooltipTriggerProps = ComponentProps<typeof Tooltip.Trigger>;
type TooltipProviderProps = ComponentProps<typeof Tooltip.Provider>;
type TooltipPortalProps = ComponentProps<typeof Tooltip.Portal>;

/* ------------------------------------------------------------------ */
/* Upstream call sites must keep compiling unchanged (§1, §7).         */
/* ------------------------------------------------------------------ */

const upstreamContent: TooltipContentProps = {};
const upstreamContentPlaced: TooltipContentProps = { side: 'bottom', sideOffset: 8, align: 'start' };
const upstreamContentClassed: TooltipContentProps = { class: 'max-w-sm', arrowClasses: 'size-2' };
const upstreamContentPortalled: TooltipContentProps = { portalProps: { disabled: true } };
const upstreamRoot: TooltipRootProps = { open: false, onOpenChange: () => {}, delayDuration: 200 };
const upstreamTrigger: TooltipTriggerProps = { disabled: false, class: 'underline' };
const upstreamPortal: TooltipPortalProps = { to: 'body' };

/*
 * The warm state, which is the one genuinely distinctive behaviour in the
 * source's tooltip — and bits-ui already has it, by a route that does not
 * involve a shared DOM singleton. `skipDelayDuration` is the window in which the
 * next trigger opens instantly.
 */
const providerWarmState: TooltipProviderProps = { delayDuration: 120, skipDelayDuration: 300 };

/* ------------------------------------------------------------------ */
/* §3.4 gives Tooltip nothing. All five props must be absent.          */
/* ------------------------------------------------------------------ */

// @ts-expect-error §3.4 gives Tooltip no gradient
const gradientTooltip: TooltipContentProps = { gradient: true };
// @ts-expect-error §3.4 gives Tooltip no glow — and §3.5 caps one lit element per surface anyway
const glowingTooltip: TooltipContentProps = { glow: true };
// @ts-expect-error §3.4 gives Tooltip no shimmer
const shimmeringTooltip: TooltipContentProps = { shimmer: true };
// @ts-expect-error §3.4 gives Tooltip no tilt — and §3.5 forbids tilt on anything hosting floating UI
const tiltingTooltip: TooltipContentProps = { tilt: true };
// @ts-expect-error §3.4 gives Tooltip no magnet
const magneticTooltip: TooltipContentProps = { magnet: true };

/* The trigger is not a surface either, and neither is the root. */
// @ts-expect-error the trigger has no effect props; it is whatever element it wraps
const glowingTrigger: TooltipTriggerProps = { glow: true };
// @ts-expect-error the root renders nothing, so there is nothing to decorate
const shimmeringRoot: TooltipRootProps = { shimmer: true };

export {
	upstreamContent,
	upstreamContentPlaced,
	upstreamContentClassed,
	upstreamContentPortalled,
	upstreamRoot,
	upstreamTrigger,
	upstreamPortal,
	providerWarmState,
	gradientTooltip,
	glowingTooltip,
	shimmeringTooltip,
	tiltingTooltip,
	magneticTooltip,
	glowingTrigger,
	shimmeringRoot
};
