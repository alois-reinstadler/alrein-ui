<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	/**
	 * alrein-ui Badge — a strict superset of the shadcn-svelte Badge.
	 *
	 * Every upstream variant and class string below is byte-identical to the file
	 * `shadcn-svelte add badge` installs; diff against the pristine commit to see
	 * only the additions.
	 *
	 * §3.4 permits Badge: ghost (already an upstream variant), gradient, glow
	 * (status-critical only) and a triggered shimmer. It is given **no** tilt and
	 * **no** magnet — a badge is a label, not an object you pick up, and a row of
	 * tilting badges is exactly the noise the capability matrix exists to prevent.
	 */
	export const badgeVariants = tv({
		base: "h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none fx-press",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
				secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
				destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
				outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
				ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
				link: "text-primary underline-offset-4 hover:underline",
			},
			gradient: {
				true: "fx-gradient border-transparent text-primary-foreground",
			},
			/*
			 * No bloom. A badge sits inline in dense text, and an outer bleed there
			 * reads as a rendering artefact rather than emphasis (SPEC.md §3.5).
			 */
			glow: {
				true: "fx-glow",
			},
			shimmer: {
				true: "fx-shimmer",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

	/** Variants that paint a surface, and therefore have something to gradient or glow from. */
	export type BadgeSurfaceVariant = Exclude<BadgeVariant, "ghost" | "link" | "outline">;

	/**
	 * The effect props Badge is allowed, conditioned on whether its variant paints
	 * a surface. `ghost`, `link` and `outline` have nothing to paint over — and in
	 * `outline`'s case a gradient would erase the border it exists for — so §3.5
	 * requires those combinations to be type errors.
	 *
	 * A conditional type rather than a discriminated union, for the same reason as
	 * Button: a union collapses under `Omit<ComponentProps<typeof Badge>, …>`,
	 * which is what a wrapper component does, and §1 makes not breaking an
	 * existing call site the stronger rule. See `button.svelte` for the long form.
	 */
	export type BadgeEffects<V extends BadgeVariant> = {
		/** A finite attention sweep on hover. Never the idle loop — that is Skeleton's. */
		shimmer?: boolean;
	} & (V extends "ghost" | "link" | "outline"
		? { gradient?: never; glow?: never }
		: {
				/** Promotional emphasis. Accent-derived stops. */
				gradient?: boolean;
				/**
				 * §3.4 restricts this to status-critical, i.e. `variant="destructive"`.
				 * A glowing "New" badge is decoration; a glowing "Payment failed" badge
				 * is a signal, and the matrix only pays for the second one.
				 */
				glow?: boolean;
			});

	export type BadgeProps<V extends BadgeVariant = "default"> = WithElementRef<HTMLAnchorAttributes> & {
		variant?: V;
	} & BadgeEffects<V>;
</script>

<script lang="ts" generics="V extends BadgeVariant = 'default'">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { glow as glowEffect } from "$lib/fx/glow.js";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { shimmer as shimmerEffect } from "$lib/fx/shimmer.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		gradient,
		glow,
		shimmer,
		...restProps
	}: BadgeProps<V> = $props();

	const fx = getFxContext();

	const paintedSurface = $derived(variant !== "ghost" && variant !== "link" && variant !== "outline");
	/* The `◐ status-critical` condition from §3.4. */
	const critical = $derived(variant === "destructive");

	const useGradient = $derived(fx.resolve("gradient", gradient, { available: paintedSurface }));
	const useGlow = $derived(fx.resolve("glow", glow, { available: paintedSurface && critical }));
	const useShimmer = $derived(fx.resolve("shimmer", shimmer));
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(
		badgeVariants({ variant, gradient: useGradient, glow: useGlow, shimmer: useShimmer }),
		className
	)}
	{...restProps}
	{@attach href ? pressEffect() : undefined}
	{@attach useGlow ? glowEffect() : undefined}
	{@attach useShimmer ? shimmerEffect({ trigger: "hover" }) : undefined}
>
	{@render children?.()}
</svelte:element>
