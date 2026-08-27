<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import type { WithoutChildrenOrChild } from "$lib/utils.js";
	import TooltipPortal from "./tooltip-portal.svelte";

	export type TooltipContentProps = TooltipPrimitive.ContentProps & {
		/** Extra classes for the arrow, merged after the defaults so a consumer wins. */
		arrowClasses?: string;
		/** Forwarded to the portal — `to`, `disabled`. */
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof TooltipPortal>>;
	};
</script>

<!--
	alrein-ui TooltipContent — a strict superset of the shadcn-svelte content.

	Everything upstream ships is still here: the portal, the arrow and its
	per-side nudges, `sideOffset`, `side`, and every prop bits-ui exposes. There
	is **no effect prop on this component and there will not be one** — §3.4's
	Tooltip row is empty across all six columns, so Tooltip's extension is motion
	and structure only. The source reaches for a decorative effect four times and
	all four are declined below.

	## What actually changed: where the motion comes from

	Upstream animates with the `tw-animate-css` cluster —
	`data-[state=delayed-open]:animate-in fade-in-0 zoom-in-95`,
	`data-closed:animate-out fade-out-0 zoom-out-95`, plus four
	`data-[side=…]:slide-in-from-…-2` classes. That is a second, unrelated motion
	scale living next to ours, with its own durations and its own easing, and
	nothing makes the two agree. `fx-scale-fade` from `motion.css` is the same
	enter/exit shape driven by `--transition-duration-*` and `--ease-fx-*`, so a
	tooltip moves at exactly the speed every other bits-ui surface in this library
	does, and collapses under `prefers-reduced-motion` with all of them from one
	`:root` override rather than from a second code path. `select-content.svelte`
	made the identical swap; this is that decision applied again, not a new one.

	The four directional `slide-in-from-*` classes go with it, and are replaced by
	something better: `--fx-transform-origin` is pointed at bits-ui's own
	`--bits-floating-transform-origin`, so the tooltip scales *out of the trigger*
	on whichever side it was actually placed — including after a flip, which a
	fixed `data-[side=top]` class cannot know about.

	**Upstream's origin utility is stale and was doing nothing.** It reads
	`origin-(--bits-tooltip-content-transform-origin)`; bits-ui 2.19 sets
	`--bits-floating-transform-origin` on the floating wrapper
	(`use-floating-layer.svelte.js`) and nothing anywhere sets the `tooltip-content`
	name. An undefined custom property makes `transform-origin` invalid, so every
	upstream tooltip zooms from its own centre. Ours does not.

	## Enter and exit timing: the house rule wins

	`fx-scale-fade` is `base` in (180ms) and one step down, `fast` (120ms), out —
	SPEC.md §2, "users never wait to dismiss". The source inverts this: 320ms in
	against **360ms out**, and §15 of the digest flags it as the one place in two
	phases where the asymmetry reverses.

	It is followed here anyway, and the source's own reasoning is why. Its exit is
	longer because it is doing something other than reversing the enter — it
	*recedes*, scaling up to 1.05 at 30% before collapsing to 0.6 with the blur
	back on, which is an anticipation curve on a 360ms budget. We decline the
	anticipation (§2 permits overshoot on press feedback and toggle thumbs, and
	nothing else), and once the exit is a plain reversal there is nothing left for
	the extra 40ms to buy: it is just a tooltip you are still waiting on after you
	have moved the pointer away. The digest reaches the same conclusion — "at
	120/180ms, do not copy the inversion".

	## Declined from the source, on the record rather than by omission

	- **The singleton travelling tooltip, and it is not close.** The source builds
	  one shared DOM node on `document.body`, reference-counts it, moves it between
	  triggers and transitions its `width`/`height` on a 1.46 spring with inline
	  styles cleaned up by a 440ms timeout. That is `F11` (layout animation), `F12`
	  (timeout as a sequencer) and `F13` (imperative DOM plus module-level mutable
	  state, which in SSR is shared across requests) in one component — and the
	  previous attempt's port of it also copied `innerHTML` between nodes, which
	  destroys every event handler and component instance inside a `content`
	  snippet and turns user-supplied text into an XSS surface. bits-ui reaches the
	  same *user-visible* idea by a legitimate route: `delayDuration` +
	  `skipDelayDuration` on the provider give the warm-state behaviour with
	  per-instance content. Row 5 of the layout-animation inventory says it
	  plainly: per-instance tooltips have nothing to morph.
	- **The 8px enter/exit blur.** Not an effect — §17 is explicit that this is the
	  `blurFade` transition primitive §4 sanctions, and `motion.css` ships it as
	  `fx-blur-fade`. It is still not used here: the scale already carries the
	  direction-out-of-the-trigger that the blur was reinforcing, and a 4px blur on
	  12px text over 180ms reads as mush rather than as softness. A consumer who
	  disagrees swaps one class.
	- **`backdrop-filter`** on the `fluent` (12px) and `glass` (16px + saturate)
	  skins. A surface treatment with no matrix row, and a compositor layer on
	  every tooltip on the page.
	- **The arrow's +30% pop** (420ms, 0 → 1.3 → 0.92 → 1) and **the whole `glow`
	  skin** (a settled halo plus a 620ms flare). Overshoot outside its two
	  permitted mechanics, and a glow on a component §3.4 grants no glow.

	Delay, positioning, flipping, dismissal, `Escape`, focus and the whole ARIA
	wiring stay bits-ui's (`F14`). The source hand-rolls flip-and-nudge, binds
	only `mouseenter`/`mouseleave`/`focusin`/`focusout` — so it has no `Escape`
	handling at all, which WAI-ARIA requires — and sets `tabIndex = 0` on the
	trigger wrapper unconditionally, which gives a wrapped button two tab stops.
	None of that is reproduced.
-->
<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 0,
		side = "top",
		children,
		arrowClasses,
		portalProps,
		...restProps
	}: TooltipContentProps = $props();
</script>

<TooltipPortal {...portalProps}>
	<TooltipPrimitive.Content
		bind:ref
		data-slot="tooltip-content"
		{sideOffset}
		{side}
		class={cn(
			"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm z-50 w-fit max-w-xs bg-foreground text-background",
			"fx-scale-fade [--fx-transform-origin:var(--bits-floating-transform-origin,center)]",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		<TooltipPrimitive.Arrow>
			{#snippet child({ props })}
				<div
					class={cn(
						"size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] z-50 bg-foreground fill-foreground",
						"data-[side=top]:translate-x-1/2 data-[side=top]:translate-y-[calc(-50%+2px)]",
						"data-[side=bottom]:-translate-x-1/2 data-[side=bottom]:-translate-y-[calc(-50%+1px)]",
						"data-[side=right]:translate-x-[calc(50%+2px)] data-[side=right]:translate-y-1/2",
						"data-[side=left]:-translate-y-[calc(50%-3px)]",
						arrowClasses
					)}
					{...props}
				></div>
			{/snippet}
		</TooltipPrimitive.Arrow>
	</TooltipPrimitive.Content>
</TooltipPortal>
