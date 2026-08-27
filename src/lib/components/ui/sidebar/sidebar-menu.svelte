<script lang="ts">
	/**
	 * alrein-ui Sidebar.Menu — upstream's `<ul>`, plus the opt-in active-item
	 * indicator (A18).
	 *
	 * With no `indicator` prop this renders exactly upstream's element and sets no
	 * context, so nothing downstream registers anything and the addition costs
	 * literally nothing. That is deliberate: an indicator is a claim about which
	 * item is current, and a component should not start making claims because it
	 * was upgraded.
	 *
	 * ## Why the indicator is a FLIP transform and not a moving box
	 *
	 * `MorphIndicator` places itself at its new box instantly and animates
	 * `transform` from the inverted old box back to identity, so `width`, `height`,
	 * `top` and `left` are never animated (§1). The digest's own reading of the
	 * source agrees: the highlight is full-width in a vertical list of
	 * uniform-height rows, so in practice only `translateY` ever changes, and
	 * `orientation="vertical"` says exactly that.
	 *
	 * The source's `.sb__hl` transitions `width` and `height` (layout inventory row
	 * 24) and its `rail` pill transitions `height` (row 25). Both are re-expressed
	 * here rather than declined, because FLIP gives the same motion with no layout
	 * animation at all.
	 *
	 * ## The wrapper element
	 *
	 * The indicator is absolutely positioned and needs a positioned ancestor, and a
	 * `<div>` is not a valid child of `<ul>`. So the indicator variant wraps the
	 * list in a `relative` div. Only the `indicator` branch does; upstream markup
	 * keeps its exact tree.
	 */
	import { untrack } from "svelte";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import MorphIndicator from "$lib/motion/morph-indicator.svelte";
	import { useSidebar } from "./context.svelte.js";
	import { SidebarIndicatorState, setSidebarIndicator } from "./sidebar-indicator.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		indicator = false,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLUListElement>> & {
		/**
		 * Render one shared indicator that slides to whichever menu button is
		 * `isActive`. Off by default; upstream marks the active item with a
		 * background, and that stays the accessible carrier of the state either way
		 * (§3.5: no effect may be the sole carrier of state).
		 */
		indicator?: boolean;
	} = $props();

	const sidebar = useSidebar();
	/*
	 * Published only when asked for, so a plain upstream menu sets no context and
	 * its buttons find nothing to register with.
	 *
	 * `untrack` because this reads the prop exactly once, on purpose: `setContext`
	 * is only legal during initialisation, so whether a menu has an indicator is a
	 * structural fact rather than a reactive one. Without it the compiler is right
	 * to warn that the initial value is all we capture.
	 */
	const state = untrack(() => indicator)
		? setSidebarIndicator(new SidebarIndicatorState())
		: null;

	/*
	 * The collapsed-target fallback from the source's `rail` skin. A sub-button is
	 * `hidden` while the rail is collapsed, and a FLIP indicator pointed at a
	 * hidden element measures a zero box at the viewport origin and flies to 0,0.
	 */
	const target = $derived(state ? state.target(sidebar?.state === "collapsed") : null);
</script>

{#snippet list()}
	<ul
		bind:this={ref}
		data-slot="sidebar-menu"
		data-sidebar="menu"
		class={cn("w-full min-w-0 gap-1 flex flex-col", className)}
		{...restProps}
	>
		{@render children?.()}
	</ul>
{/snippet}

{#if indicator}
	<div data-slot="sidebar-menu-track" class="relative">
		<!--
			Painted behind the buttons, and `aria-hidden` inside MorphIndicator: the
			active item already announces itself through `aria-current` or
			`data-active` on the button, and announcing it twice is worse than not
			announcing it at all.
		-->
		<MorphIndicator
			{target}
			orientation="vertical"
			class="rounded-md bg-sidebar-accent transition-opacity duration-fast ease-fx-out"
		/>
		{@render list()}
	</div>
{:else}
	{@render list()}
{/if}
