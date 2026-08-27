<script lang="ts">
	/**
	 * alrein-ui Sidebar.Rail — upstream's file with one edit: `ease-linear` becomes
	 * the motion scale.
	 *
	 * Upstream writes `transition-all ease-linear` with no duration, so it runs on
	 * Tailwind's 150ms default on a curve that is not in §2's set. `duration-fast
	 * ease-fx-out` is the same speed on the library's own easing, which is the
	 * point of having a scale at all (`F5`).
	 *
	 * Everything else is upstream's, including `tabindex={-1}` and the `title`:
	 * the rail is a redundant pointer affordance for `Sidebar.Trigger`, which is
	 * the keyboard-reachable one, and the ⌘B shortcut is a third route. That is
	 * upstream's a11y decision and it is a defensible one, so it stays (`F14`).
	 */
	import { cn, type WithElementRef } from "$lib/utils.js";
	import { useSidebar } from "./context.svelte.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> = $props();

	const sidebar = useSidebar();
</script>

<button
	bind:this={ref}
	data-sidebar="rail"
	data-slot="sidebar-rail"
	aria-label="Toggle Sidebar"
	tabindex={-1}
	onclick={sidebar.toggle}
	title="Toggle Sidebar"
	class={cn(
		"hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all duration-fast ease-fx-out group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
		"in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
		"[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
		"group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
		"[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
		"[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</button>
