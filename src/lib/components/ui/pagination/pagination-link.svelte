<script lang="ts" module>
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import type { ButtonSize } from "$lib/components/ui/button/index.js";

	export type PaginationLinkProps = PaginationPrimitive.PageProps & {
		size?: ButtonSize;
		isActive: boolean;
	};
</script>

<script lang="ts">
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { getPaginationTrack } from "./pagination.svelte.js";

	/**
	 * alrein-ui PaginationLink — a strict superset of the shadcn-svelte one.
	 *
	 * Upstream's variants, sizes, `aria-current` and fallback snippet are
	 * unchanged. Three things are added, none of which is decorative:
	 *
	 * - the link registers its element with the track, so `MorphIndicator` has
	 *   something to measure (A18: Pagination is the fourth real consumer of that
	 *   primitive, and §4.9 missed it);
	 * - the active link stops painting its own outline once the indicator is live,
	 *   so the control does not carry two identical pills, one of which teleports;
	 * - press. `buttonVariants` already puts `fx-press` on every button in the
	 *   library, but the class alone is inert — `--fx-press` stays at 0 until the
	 *   attachment writes it — so upstream's pagination has been carrying a dead
	 *   press since it was installed. §3.1: press is not opt-in.
	 *
	 * `aria-current="page"` stays exactly where upstream put it. §3.5's
	 * accessibility floor cuts both ways: the indicator may not be the sole
	 * carrier of "this is the current page", and it may not be a second announced
	 * carrier either, which is why `MorphIndicator` is `aria-hidden`.
	 *
	 * The vuesax source's 3D press tilt on these buttons (`perspective(420px)`) is
	 * declined by A10 and A20 — a pagination button routinely hosts a tooltip, and
	 * `perspective()` would make it the containing block the tooltip anchors to.
	 */
	let {
		ref = $bindable(null),
		class: className,
		size = "icon",
		isActive,
		page,
		children,
		...restProps
	}: PaginationLinkProps = $props();

	const track = getPaginationTrack();

	$effect(() => {
		const node = ref;
		const value = page.value;
		if (!track) return;
		track.register(value, node);
		return () => track.unregister(value, node);
	});
</script>

{#snippet Fallback()}
	{page.value}
{/snippet}

<PaginationPrimitive.Page
	bind:ref
	{page}
	aria-current={isActive ? "page" : undefined}
	data-slot="pagination-link"
	data-active={isActive}
	data-size={size}
	class={cn(
		buttonVariants({ size, variant: isActive ? "outline" : "ghost" }),
		"cn-pagination-link",
		/* Motion from the scale, not from Tailwind's 150ms default (§2). */
		"duration-base ease-fx-out",
		/*
		 * The handoff, keyed on an attribute so a link composed outside an alrein
		 * root keeps upstream's appearance untouched. `data-active:` is safe even
		 * though upstream passes the boolean straight through and Svelte renders
		 * `data-active="false"`: Tailwind v4's `data-active` is a named variant,
		 * not a bare attribute test, and compiles to
		 * `:where([data-state=active]), :where([data-active]:not([data-active=false]))`.
		 * Checked in the built stylesheet rather than assumed.
		 */
		"group-data-[indicator=on]/pagination:data-active:border-transparent group-data-[indicator=on]/pagination:data-active:bg-transparent group-data-[indicator=on]/pagination:data-active:shadow-none dark:group-data-[indicator=on]/pagination:data-active:border-transparent dark:group-data-[indicator=on]/pagination:data-active:bg-transparent",
		className
	)}
	{...restProps}
	{@attach pressEffect()}
>
	{#if children}
		{@render children?.()}
	{:else}
		{@render Fallback()}
	{/if}
</PaginationPrimitive.Page>
