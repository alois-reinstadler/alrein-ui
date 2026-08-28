<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	/**
	 * alrein-ui Card — a strict superset of the shadcn-svelte Card.
	 *
	 * The upstream class string is byte-identical and the six sub-components
	 * (`Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`,
	 * `Card.Footer`, `Card.Action`) are untouched. The prior attempt collapsed all
	 * seven files into a single monolith with a variant enum, which deleted
	 * `<Card.Header>` from the API outright (SPEC.md §8, `F1`).
	 *
	 * §3.4 permits Card: gradient (hero variant only), glow (interactive only) and
	 * tilt. No ghost — a card is a surface, transparency is not one of its states.
	 *
	 * A6 and why it matters: the upstream root is `overflow-hidden`, which is what
	 * rounds the corners of a first-child `<img>`. Removing it would change how
	 * every existing card looks, so Card's glow is the inner clipped layer
	 * (`fx-glow`) and never the outer bleed (`fx-glow-bloom`, which is Button's).
	 */
	export const cardVariants = tv({
		base: "gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl group/card flex flex-col",
		variants: {
			/*
			 * `hero` is the promotional surface the matrix allows a gradient on. It
			 * is additive: a card with no `variant` renders exactly as it does
			 * upstream.
			 */
			variant: {
				default: "",
				hero: "",
			},
			gradient: {
				true: "fx-gradient text-primary-foreground ring-transparent",
			},
			glow: {
				true: "fx-glow",
			},
			tilt: {
				true: "fx-tilt",
			},
			interactive: {
				true: "fx-press fx-press-tilt cursor-pointer",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type CardVariant = VariantProps<typeof cardVariants>["variant"];

	export type CardProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		size?: "default" | "sm";
		/** `hero` marks a promotional surface, and is the only variant §3.4 lets a gradient onto. */
		variant?: CardVariant;
		/**
		 * Marks the whole card as a click target. This is the `◐ interactive only`
		 * condition on glow: glow means "highest-intent target on this surface"
		 * (§3.1), so a card you cannot click has nothing to promise.
		 */
		interactive?: boolean;
		/** Promotional emphasis. Requires `variant="hero"`. */
		gradient?: boolean;
		/** Pointer-tracked inner highlight. Requires `interactive`. */
		glow?: boolean;
		/**
		 * "A discrete object you can pick up" (§3.1).
		 *
		 * §3.5, and this is a real footgun: the `transform` this applies creates a
		 * containing block for `position: fixed`. **Do not tilt a card that
		 * contains a popover, dropdown, tooltip or select** — the portal will
		 * anchor to the transformed card and land in the wrong place. Also keep it
		 * off grids of more than about six cards.
		 */
		tilt?: boolean;
	};
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { glow as glowEffect } from "$lib/fx/glow.js";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { tilt as tiltEffect } from "$lib/fx/tilt.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		variant = "default",
		interactive = false,
		gradient,
		glow,
		tilt,
		...restProps
	}: CardProps = $props();

	const fx = getFxContext();

	const useGradient = $derived(fx.resolve("gradient", gradient, { available: variant === "hero" }));
	const useGlow = $derived(fx.resolve("glow", glow, { available: interactive }));
	/*
	 * Card is the one component with tilt as an unconditional `●`, and the one
	 * that lights it up on its own at `data-fx="expressive"` (§3.3).
	 */
	const useTilt = $derived(fx.resolve("tilt", tilt, { fxDefault: true }));
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-size={size}
	data-variant={variant}
	class={cn(
		cardVariants({
			variant,
			gradient: useGradient,
			glow: useGlow,
			tilt: useTilt,
			interactive,
		}),
		className
	)}
	{...restProps}
	{@attach interactive ? pressEffect() : undefined}
	{@attach useGlow ? glowEffect() : undefined}
	{@attach useTilt ? tiltEffect() : undefined}
>
	{@render children?.()}
</div>
