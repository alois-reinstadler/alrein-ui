<script lang="ts" module>
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { tv } from "tailwind-variants";
	import type { PaginationVariant } from "./pagination.svelte.js";

	/**
	 * alrein-ui Pagination — a strict superset of the shadcn-svelte Pagination.
	 *
	 * The upstream class string, `role`, `aria-label` and `data-slot` are
	 * unchanged; `relative` and the group name are added so the root can host the
	 * shared `MorphIndicator`, and neither can move anything (§1).
	 *
	 * ## Keyboard handling — what bits-ui already ships (A24)
	 *
	 * A24 records that the vuesax source "has no keyboard handling at all", and
	 * instructs us to check bits-ui before hand-rolling a roving tabindex, because
	 * hand-rolling one is `F14`. bits-ui has it:
	 * `dist/bits/pagination/pagination.svelte.js` gives every page trigger *and*
	 * both arrows a shared `handleTriggerKeydown` with Left/Right (or Up/Down,
	 * chosen from `orientation` and the resolved text direction), Home, End and an
	 * optional `loop`. Enter and Space activate. So arrow navigation is not ours
	 * to write, and `loop` and `orientation` are named explicitly below — at
	 * bits-ui's own defaults — rather than being invisible inside a spread.
	 *
	 * What bits-ui does **not** do is move `tabindex`, so every rendered page
	 * button is still a tab stop. That is deliberately left alone, because the
	 * defect A24 describes does not survive the change of design: the source has
	 * no ellipsis, so a 100-page set renders 100 buttons. bits-ui's `getPageItems`
	 * windows the run — first, last, `siblingCount` either side of the current
	 * page, ellipses between — so at `siblingCount = 1` the control renders at
	 * most seven page buttons no matter how large `count` is. Nine tab stops for a
	 * navigation landmark is ordinary, and a roving tabindex would additionally
	 * take Tab away as a way out of the group for anyone who does not know the
	 * arrows work.
	 */
	export const paginationVariants = tv({
		base: "cn-pagination group/pagination relative mx-auto flex w-full justify-center",
		variants: {
			variant: {
				full: "",
				/*
				 * §5 collapses `pagination-compact` into this variant. It is prev /
				 * status / next, so it shrinks to its content instead of centring
				 * inside a full-width row.
				 */
				compact: "w-fit items-center gap-1"
			}
		},
		defaultVariants: {
			variant: "full"
		}
	});

	/**
	 * The indicator reproduces the active link's own resting appearance —
	 * `buttonVariants({ variant: "outline" })` — so the still frame is unchanged
	 * and only the travel between frames is new.
	 */
	export const paginationIndicatorVariants = tv({
		base: "rounded-md border border-border bg-background shadow-xs dark:border-input dark:bg-input/30"
	});

	export type PaginationProps = PaginationPrimitive.RootProps & {
		variant?: PaginationVariant;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import MorphIndicator from "$lib/motion/morph-indicator.svelte";
	import { setPaginationRoot, setPaginationTrack } from "./pagination.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		count = 0,
		perPage = 10,
		page = $bindable(1),
		siblingCount = 1,
		loop = false,
		orientation = "horizontal",
		variant = "full",
		/*
		 * Aliased. The snippet below is *named* `children` because that is the prop
		 * bits-ui reads, and inside its own body that name would otherwise resolve to
		 * the snippet rather than to the prop — which renders the component into
		 * itself until the stack runs out. SSR finds this instantly; `svelte-check`
		 * does not.
		 */
		children: consumerChildren,
		...restProps
	}: PaginationProps = $props();

	/* The same derivation bits-ui makes internally; it does not expose it. */
	const totalPages = $derived(count === 0 ? 1 : Math.ceil(count / perPage));

	setPaginationRoot({
		get page() {
			return page;
		},
		get totalPages() {
			return totalPages;
		},
		get variant() {
			return variant;
		}
	});

	const track = setPaginationTrack();

	const indicatorOrientation = $derived(orientation === "vertical" ? "vertical" : "horizontal");
</script>

<PaginationPrimitive.Root
	bind:ref
	bind:page
	role="navigation"
	aria-label="pagination"
	data-slot="pagination"
	data-variant={variant}
	data-indicator={track.active ? "on" : "off"}
	{count}
	{perPage}
	{siblingCount}
	{loop}
	{orientation}
	class={cn(paginationVariants({ variant }), className)}
	{...restProps}
>
	{#snippet children(snippetProps)}
		<!--
			The indicator lives on the root rather than inside `Pagination.Content`
			for a plain markup reason: `Content` is a `<ul>`, and a `<div>` is not a
			permitted child of one. Hosting it here keeps the list valid and still
			gives it a positioned ancestor to measure against.

			`compact` has no page buttons, so it has nothing to indicate.

			Layout inventory rows 17-19: the source animates this indicator's `width`
			on a spring — 420ms at (0.34, 1.4, 0.64, 1), relaxed to 1.12 at the first
			and last page. §1 forbids animating `width` at all, so it is re-expressed
			as the same FLIP every other consumer of this primitive uses: place at
			the new box, animate `transform` back to the old one. Because every page
			button is `size-9`, the scale factor between two of them is exactly 1 and
			the move is a pure `translateX` — which is also why the `border-radius`
			distortion A19 flags is not visible here the way it is on a tab strip.
		-->
		{#if variant === "full"}
			<MorphIndicator
				target={track.active}
				orientation={indicatorOrientation}
				data-variant={variant}
				class={cn(paginationIndicatorVariants())}
			/>
		{/if}
		{@render consumerChildren?.(snippetProps)}
	{/snippet}
</PaginationPrimitive.Root>
