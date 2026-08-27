<script lang="ts" module>
	import { tv } from "tailwind-variants";

	/**
	 * alrein-ui Breadcrumb.Link — upstream's file, plus press and a real touch
	 * target.
	 *
	 * ## The touch-target correction, stolen verbatim
	 *
	 * The source pads the hit box out to the 24px thumb floor and pulls the
	 * padding back with an **equal negative margin**, so the crumb is hittable
	 * without inflating it or breaking the line box. That is the whole trick, it
	 * is two utilities, and it is the one thing in the source's breadcrumb that
	 * survives every decline. At `variant="ghost"` the padding becomes visible
	 * instead — the negative margin is dropped and the same box gains a surface.
	 *
	 * ## Press
	 *
	 * §3.1: press is not opt-in, it is the acknowledgement that a click
	 * registered. `inline-flex` is load-bearing rather than cosmetic — `scale`
	 * does not apply to a non-replaced inline box, so a plain `<a>` would carry
	 * `fx-press` and do nothing.
	 *
	 * The source's own press is declined in both its parts (the 3D tilt, A10/A20;
	 * the 620ms spring peaking at 1.15, A11) — see `breadcrumb.svelte` for the
	 * reasoning. What ships is the flat scale §2 specifies, which is also what the
	 * source's own majority of components use.
	 */
	export const breadcrumbLinkVariants = tv({
		base: "transition-colors hover:text-foreground inline-flex items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 fx-press",
		variants: {
			variant: {
				/* Hit box out to the thumb floor, then pulled back so nothing moves. */
				default: "-mx-1.5 -my-1 px-1.5 py-1",
				/* Same box, now painted: transparent at rest, tinted on hover (§3.1). */
				ghost: "mx-0 my-0 px-2 py-1 hover:bg-muted hover:text-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { getBreadcrumbContext } from "./breadcrumb.svelte";

	let {
		ref = $bindable(null),
		class: className,
		href = undefined,
		child,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		child?: Snippet<[{ props: HTMLAnchorAttributes }]>;
	} = $props();

	const breadcrumb = getBreadcrumbContext();

	const attrs = $derived({
		"data-slot": "breadcrumb-link",
		class: cn(breadcrumbLinkVariants({ variant: breadcrumb.variant }), className),
		href,
		...restProps,
	});
</script>

<!--
	The `child` branch hands the props to the consumer's own element, which is how
	upstream lets a framework `<a>` (SvelteKit, an `<a>` inside a `Link`) take
	over. It gets the classes but not the attachment: an attachment belongs to an
	element this component renders, and there is no element here to attach to.
-->
{#if child}
	{@render child({ props: attrs })}
{:else}
	<a bind:this={ref} {...attrs} {@attach pressEffect()}>
		{@render children?.()}
	</a>
{/if}
