<script lang="ts">
	/**
	 * alrein-ui Breadcrumb.Page — the current crumb.
	 *
	 * ## One narrow, deliberate correction to upstream
	 *
	 * Upstream renders `role="link" aria-disabled="true" aria-current="page"` on a
	 * `<span>`. The digest names that exact shape as wrong twice over: "the last
	 * crumb is not a link — `aria-current="page"`, `cursor: default`,
	 * full-strength colour, no hover. Rendering it as a disabled link is wrong
	 * twice." A screen reader announces "link, dimmed" for something that is
	 * neither a link nor disabled, and it is not focusable either, so
	 * `aria-disabled` describes nothing.
	 *
	 * `aria-current="page"` on a plain span is the whole correct answer, and it is
	 * what both the source and the ARIA practices do. `role` and `aria-disabled`
	 * are simply not emitted; `{...restProps}` comes last, so a consumer who wants
	 * upstream's markup writes `role="link" aria-disabled="true"` and gets it back.
	 *
	 * This is the only place in the three Phase 3 components where the superset
	 * *changes* an upstream attribute rather than adding to one, and it changes
	 * only what a screen reader says. Nothing visual moves and nothing stops
	 * compiling — `BreadcrumbPageProps` is unchanged.
	 *
	 * §3.4 gives Breadcrumb `ghost` and nothing else, so the current crumb takes
	 * the same box as a ghost link (for alignment) and no surface: it is not a
	 * target, so it must not look like one.
	 */
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { getBreadcrumbContext } from "./breadcrumb.svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();

	const breadcrumb = getBreadcrumbContext();
</script>

<span
	bind:this={ref}
	data-slot="breadcrumb-page"
	aria-current="page"
	class={cn(
		"font-normal text-foreground",
		breadcrumb.variant === "ghost" && "inline-flex items-center rounded-md px-2 py-1",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</span>
