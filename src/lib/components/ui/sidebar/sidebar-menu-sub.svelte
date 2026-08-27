<script lang="ts">
	/**
	 * alrein-ui Sidebar.MenuSub — upstream's `<ul>`, plus the A21 collapse.
	 *
	 * With no `open` prop this renders upstream's element unchanged: an
	 * always-visible nested list. Pass `open` and the list is wrapped in the
	 * `fx-collapse` grid and animates between `0fr` and `1fr`.
	 *
	 * ## A16/A21 carve-out — read this before filing an `F11`
	 *
	 * `fx-collapse` animates `grid-template-rows`, which is a layout property, and
	 * §1 bans animating layout properties. This is the **A16 carve-out** (layout
	 * inventory row 26, the second of the two `0fr ↔ 1fr` sites): the layout
	 * change *is* the animation. It needs no measurement, so no `transitionend`
	 * listener and no timeout guard (A22), and it survives the submenu's content
	 * changing while it is open.
	 * `scripts/check-layout-safety.mjs` allowlists `.fx-collapse` by name with the
	 * same reason at the other end.
	 *
	 * **Both of the source's curves are declined** (row 26). It opens on
	 * `cubic-bezier(0.34, 1.8, 0.5, 1)` — an overshoot, which on `0fr → 1fr` opens
	 * the submenu taller than its own items and settles back — and closes on
	 * `cubic-bezier(0.5, -0.6, 0.5, 1)`, an *anticipation* that pulls the list
	 * open a little before shutting it. Anticipation is a character beat; §2's
	 * exit rule is that leaving is one step faster than entering, which is what
	 * `fx-collapse` already does.
	 *
	 * ## Visibility, and why it is in the transition list
	 *
	 * A submenu clipped to `0fr` is still in the DOM, still in the accessibility
	 * tree and still tabbable. `visibility` fixes that and is one of the few
	 * discretely-animated properties that transitions usefully: it flips to
	 * `visible` at the *start* of an opening transition and to `hidden` only at the
	 * *end* of a closing one, so the list is reachable exactly while it is on
	 * screen — with no timer and no listener.
	 *
	 * ## The disclosure semantics are not hand-rolled here, and were checked
	 *
	 * A24 says not to hand-roll ARIA or keyboard handling for a disclosure without
	 * checking what already exists. bits-ui ships `Collapsible`, and shadcn-svelte's
	 * documented Sidebar pattern composes it around `Sidebar.MenuItem`. That is
	 * still the intended composition and it is what a consumer should reach for.
	 * This component deliberately owns **only the animation**: `open` mirrors
	 * whatever already knows the answer, so it works under bits-ui's `Collapsible`
	 * (with `forceMount` on `Collapsible.Content`, for the same reason
	 * `Accordion.Content` needs it — a CSS transition needs a before-change style
	 * and a presence layer does not leave one) and equally under a plain
	 * `<button aria-expanded aria-controls>`, which is the native disclosure and
	 * needs no keyboard code at all.
	 */
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { setSidebarMenuSubContext } from "./sidebar-indicator.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		open = undefined,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLUListElement>> & {
		/**
		 * Expanded state. Leave it `undefined` for upstream's always-visible
		 * submenu; pass a boolean and the list collapses and expands with it.
		 */
		open?: boolean;
	} = $props();

	setSidebarMenuSubContext({
		get open() {
			return open ?? true;
		},
	});
</script>

{#snippet list()}
	<ul
		bind:this={ref}
		data-slot="sidebar-menu-sub"
		data-sidebar="menu-sub"
		class={cn(
			"mx-3.5 translate-x-px gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden flex min-w-0 flex-col",
			open !== undefined &&
				"transition-[visibility] duration-base ease-fx-out group-data-[state=closed]/menu-sub:invisible",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</ul>
{/snippet}

{#if open === undefined}
	{@render list()}
{:else}
	<div
		data-slot="sidebar-menu-sub-collapse"
		data-state={open ? "open" : "closed"}
		class="fx-collapse group/menu-sub"
	>
		{@render list()}
	</div>
{/if}
