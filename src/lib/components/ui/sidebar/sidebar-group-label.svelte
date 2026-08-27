<script lang="ts">
	/**
	 * alrein-ui Sidebar.GroupLabel — upstream's file with the motion scale.
	 *
	 * `transition-[margin,opacity] duration-200 ease-linear` becomes
	 * `duration-slow ease-fx-out`, so the label leaves on the same token as the
	 * rail it is leaving with.
	 *
	 * ## Why `margin` stays in that list
	 *
	 * It is animating a layout property, and it is the **A16 carve-out** already
	 * documented in `sidebar.svelte`: the `-mt-8` is *how* the label is removed
	 * when the rail collapses to icons — it is the same collapse, one element
	 * further in, not a decoration over it. Snapping the margin while the opacity
	 * fades would make the group below jump before the label had finished going.
	 *
	 * This is a different case from layout inventory rows 22 and 23, which are
	 * declined: those animate `padding-left` on an item and `margin-right` on a
	 * badge to express *selection*, which is a decoration over a layout property
	 * and has a transform-only equivalent. This one has none — there is no
	 * transform that removes an element's height.
	 */
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> & {
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();

	const mergedProps = $derived({
		class: cn(
			"h-8 rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring transition-[margin,opacity] duration-slow ease-fx-out group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 flex shrink-0 items-center outline-hidden [&>svg]:shrink-0",
			className
		),
		"data-slot": "sidebar-group-label",
		"data-sidebar": "group-label",
		...restProps,
	});
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<div bind:this={ref} {...mergedProps}>
		{@render children?.()}
	</div>
{/if}
