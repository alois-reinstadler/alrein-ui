<script lang="ts">
	import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	/**
	 * alrein-ui PaginationEllipsis — the shadcn-svelte one with one bug fixed.
	 *
	 * Upstream puts `aria-hidden="true"` on the wrapper *and* an
	 * `<span class="sr-only">More pages</span>` inside it. The second is
	 * unreachable: `aria-hidden` prunes the whole subtree, so the screen-reader
	 * text it exists to provide is never announced and the gap in the page run is
	 * silent. `aria-hidden` moves to the icon, which is the part that is genuinely
	 * decorative, and the sr-only text does its job.
	 *
	 * That is the same class of defect A24 catalogues in the vuesax source —
	 * something that looks like a deliberate choice in the markup and is not.
	 * Visually nothing changes.
	 */
	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> = $props();
</script>

<span
	bind:this={ref}
	data-slot="pagination-ellipsis"
	class={cn("size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4 flex items-center justify-center", className)}
	{...restProps}
>
	<MoreHorizontalIcon aria-hidden="true" />
	<span class="sr-only">More pages</span>
</span>
