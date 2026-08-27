<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef, WithoutChildren } from "$lib/utils.js";

	export type PaginationStatusProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLSpanElement>>
	> & {
		/** Override the rendering. Receives the same numbers the default uses. */
		children?: Snippet<[{ page: number; totalPages: number }]>;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { getPaginationRoot } from "./pagination.svelte.js";

	/**
	 * alrein-ui addition — the readout `variant="compact"` is built around.
	 *
	 * §5 collapses `pagination` and `pagination-compact` into one component, and
	 * the compact skin is prev / current page / next. The source renders that
	 * middle part as a **number reel**: the digit rolls up or down by direction
	 * through a 7px blur, and the reel's own width — in `ch` — springs whenever
	 * the digit count changes.
	 *
	 * Layout inventory row 20 declines it, and the replacement is the whole
	 * reason: `font-variant-numeric: tabular-nums` plus a width reserved in `ch`
	 * means the readout never changes size, so there is nothing left to animate.
	 * That also removes the one place in Phase 2/3 that needed a `transitionend`
	 * listener with a timeout fallback (A22: the fallback is needed exactly where
	 * a measurement is, and this is no longer a measurement).
	 *
	 * `aria-live="polite"` because compact has no page buttons and therefore no
	 * `aria-current="page"` to carry the change. Without it, pressing "next"
	 * announces nothing at all.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: PaginationStatusProps = $props();

	const root = getPaginationRoot();

	const page = $derived(root?.page ?? 1);
	const totalPages = $derived(root?.totalPages ?? 1);

	/*
	 * Two digits' worth of room on each side by default, widened only when the
	 * page count genuinely needs it. `ch` against `tabular-nums` is an exact
	 * measure, so the box is stable for the whole life of the control rather than
	 * stable-until-page-10.
	 */
	const digits = $derived(String(totalPages).length);
	const reserved = $derived(`min-width: ${digits * 2 + 3}ch`);
</script>

<span
	bind:this={ref}
	data-slot="pagination-status"
	aria-live="polite"
	style={reserved}
	class={cn(
		"inline-flex h-9 items-center justify-center px-2 text-sm text-muted-foreground tabular-nums",
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children({ page, totalPages })}
	{:else}
		{page} / {totalPages}
	{/if}
</span>
