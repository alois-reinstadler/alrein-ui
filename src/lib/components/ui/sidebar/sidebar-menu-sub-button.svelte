<script lang="ts">
	/**
	 * alrein-ui Sidebar.MenuSubButton — upstream's file plus press, and the
	 * indicator registration with the collapsed-target rule.
	 *
	 * `fx-press` is appended to upstream's class string and the attachment is on
	 * the element this component renders. §3.1: press is always on, never opt-in.
	 * The element is already `display: flex`, so `scale` applies to it — a plain
	 * inline `<a>` would carry the class and do nothing.
	 *
	 * The active sub-button registers itself as the indicator's target **only
	 * while its own submenu is open**. That is the source's `rail` detail worth
	 * keeping: an indicator that follows a clipped or hidden element measures a
	 * zero box and flies to `0,0`, which is the most visible possible bug in a
	 * FLIP indicator. `Sidebar.Menu` handles the other half of the same rule — the
	 * fallback to the parent item while the rail is collapsed.
	 */
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { getSidebarIndicator, getSidebarMenuSubContext } from "./sidebar-indicator.svelte.js";

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		size = "md",
		isActive = false,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		child?: Snippet<[{ props: Record<string, unknown> }]>;
		size?: "sm" | "md";
		isActive?: boolean;
	} = $props();

	const indicator = getSidebarIndicator();
	const sub = getSidebarMenuSubContext();

	$effect(() => {
		if (!indicator || !isActive || !ref || !sub.open) return;
		indicator.activeSubItem = ref;
		return () => {
			if (indicator.activeSubItem === ref) indicator.activeSubItem = null;
		};
	});

	const mergedProps = $derived({
		class: cn(
			"h-7 gap-2 rounded-md px-2 text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:text-sidebar-accent-foreground flex min-w-0 -translate-x-px items-center overflow-hidden outline-hidden group-data-[collapsible=icon]:hidden disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:shrink-0 fx-press",
			className
		),
		"data-slot": "sidebar-menu-sub-button",
		"data-sidebar": "menu-sub-button",
		"data-size": size,
		"data-active": isActive,
		...restProps,
	});
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<a bind:this={ref} {...mergedProps} {@attach pressEffect()}>
		{@render children?.()}
	</a>
{/if}
