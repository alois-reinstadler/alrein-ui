<!--
	alrein-ui SelectContent — a strict superset of the shadcn-svelte content.

	Everything upstream ships is still here: the portal, both scroll buttons, the
	viewport and its anchor-sized width. The one change is where the motion comes
	from. Upstream animates with tw-animate-css (`data-open:animate-in
	zoom-in-95`, `duration-100`), which is a second, unrelated motion scale;
	`fx-scale-fade` is the same enter/exit shape driven by `--transition-duration-*`
	and `--ease-fx-*`, so this surface moves at exactly the speed every other
	bits-ui surface in the library does and collapses under reduced motion with
	them. `--fx-transform-origin` is pointed at bits-ui's own anchor origin, which
	`motion.css` documents as the floating-component hook, so the menu unfolds
	from the trigger rather than from its own middle — the readable half of what
	the vuesax morph was doing.

	**A13, and the close handoff.** The trigger→menu height morph is not ported:
	it animates `height` over 560ms off inline styles, a `transitionend` listener
	and a timeout fallback, all three of which §1 bans. The *other* idea in that
	source — the real trigger reappearing already carrying `blur(3.6px)` which
	then clears, so the swap from menu back to trigger is never visible — is a
	`filter` and would be portable, but it is **not ported either, for a
	structural reason rather than a ban**: vuesax hides the real trigger on open
	and paints a clone over the menu, so it has a swap to conceal. Ours never
	hides the trigger, so there is nothing to hand the blur off *to*. A blur on
	the closing menu alone would not be a handoff, it would be decoration — and
	§3.4 gives Select none. Recorded for Phase 2's popovers, where a surface
	really does replace its trigger.
-->
<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";
	import type { WithoutChildrenOrChild } from "$lib/utils.js";
	import SelectPortal from "./select-portal.svelte";
	import SelectScrollDownButton from "./select-scroll-down-button.svelte";
	import SelectScrollUpButton from "./select-scroll-up-button.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		portalProps,
		children,
		preventScroll = true,
		...restProps
	}: WithoutChild<SelectPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SelectPortal>>;
	} = $props();
</script>

<SelectPortal {...portalProps}>
	<SelectPrimitive.Content
		bind:ref
		{sideOffset}
		{preventScroll}
		data-slot="select-content"
		class={cn(
			"min-w-36 rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 fx-scale-fade [--fx-transform-origin:var(--bits-floating-transform-origin,center)] relative isolate z-50 overflow-x-hidden overflow-y-auto",
			className
		)}
		{...restProps}
	>
		<SelectScrollUpButton />
		<SelectPrimitive.Viewport
			class={cn(
				"h-(--bits-select-anchor-height) w-full min-w-(--bits-select-anchor-width) scroll-my-1"
			)}
		>
			{@render children?.()}
		</SelectPrimitive.Viewport>
		<SelectScrollDownButton />
	</SelectPrimitive.Content>
</SelectPortal>
