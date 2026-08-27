<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

	/**
	 * alrein-ui Button — a strict superset of the shadcn-svelte Button.
	 *
	 * Every upstream variant, size, prop and class string below is byte-identical
	 * to the file `shadcn-svelte add button` installs. `git log` has the pristine
	 * upstream as its own commit, so this file diffs cleanly against it.
	 *
	 * What is added:
	 *   - `fx-press` on the base. Press is not opt-in (SPEC.md §3.1) — it is the
	 *     acknowledgement that a click registered. At rest it is visually inert:
	 *     `scale: 1` and a tint at opacity 0.
	 *   - five effect variants, each resolving to Tailwind utility classes so
	 *     `cn()` still merges and a consumer's `class` still wins (A2).
	 *
	 * §3.4 permits Button: gradient (primary only), glow (primary/accent),
	 * shimmer (triggered), tilt (size >= md, standalone), magnet (expressive
	 * only). Those conditions are evaluated below; the effect props simply do not
	 * exist on components the matrix does not permit them for.
	 */
	export const buttonVariants = tv({
		base: "rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 fx-press",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/80",
				outline: "border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
				ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
				destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
				lg: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				icon: "size-9",
				"icon-xs": "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md",
				"icon-lg": "size-10",
			},
			/*
			 * The alrein additions. Each is a plain utility class, not a BEM
			 * modifier — the prior attempt mapped every variant to `rx-button--x`
			 * and hand-wrote the CSS, which meant `cn()` could not merge anything
			 * and a consumer's `class="h-12"` lost to specificity (SPEC.md §8, `F3`).
			 */
			gradient: {
				true: "fx-gradient border-transparent text-primary-foreground",
			},
			glow: {
				true: "fx-glow fx-glow-bloom",
			},
			shimmer: {
				true: "fx-shimmer",
			},
			tilt: {
				true: "fx-tilt",
			},
			magnet: {
				true: "fx-magnet",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	/** Variants that paint a surface, and therefore have something to gradient or glow from. */
	export type ButtonSurfaceVariant = Exclude<ButtonVariant, "ghost" | "link">;

	interface ButtonEffects {
		/** Primary emphasis. Accent-derived stops, never a hardcoded pair. Requires a painted variant. */
		gradient?: boolean;
		/** "Highest-intent target on this surface." Pointer-tracked. Requires a painted variant. */
		glow?: boolean;
		/** A finite attention sweep on hover. Not the loading loop — that is Skeleton's. */
		shimmer?: boolean;
		/** "A discrete object you can pick up." Needs a reasonable hit area, so size >= default. */
		tilt?: boolean;
		/** The unmissable single CTA. `data-fx="expressive"` only, never in chrome, a form or a list. */
		magnet?: boolean;
	}

	type ButtonBase = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & { size?: ButtonSize };

	/**
	 * `ghost + gradient` and `ghost + glow` are contradictions — a transparent
	 * surface has nothing to paint and nothing to glow from — so SPEC.md §3.5
	 * requires them to be **type errors, not doc comments**. That is what this
	 * union does: on `ghost` and `link` the two props are typed `never`.
	 */
	export type ButtonProps = ButtonBase &
		(
			| ({ variant?: ButtonSurfaceVariant } & ButtonEffects)
			| ({ variant: "ghost" | "link"; gradient?: never; glow?: never } & Omit<
					ButtonEffects,
					"gradient" | "glow"
			  >)
		);
</script>

<script lang="ts">
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { glow as glowEffect } from "$lib/fx/glow.js";
	import { magnet as magnetEffect } from "$lib/fx/magnet.js";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { shimmer as shimmerEffect } from "$lib/fx/shimmer.js";
	import { tilt as tiltEffect } from "$lib/fx/tilt.js";

	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		gradient,
		glow,
		shimmer,
		tilt,
		magnet,
		...restProps
	}: ButtonProps = $props();

	const fx = getFxContext();

	/*
	 * The `◐` conditions from §3.4. Only the component can evaluate these, so it
	 * passes them to `resolve` rather than the context guessing.
	 */
	const paintedSurface = $derived(variant !== "ghost" && variant !== "link");
	const largeEnoughToTilt = $derived(
		size === "default" || size === "lg" || size === "icon" || size === "icon-lg"
	);

	/*
	 * Every effect goes through the same seven-step chain in `FxContext.resolve`
	 * (§3.2). No component tests `prefers-reduced-motion` or `pointer: coarse`
	 * itself — the prior attempt copy-pasted those checks into 124 places and
	 * still missed one (SPEC.md §8, `F8`/`F10`).
	 *
	 * `fxDefault` is what lights up on its own at `data-fx="expressive"`. Only the
	 * primary button claims one: at expressive, the primary action on a surface
	 * glows. Everything else stays dark until asked.
	 */
	const useGradient = $derived(fx.resolve("gradient", gradient, { available: paintedSurface }));
	const useGlow = $derived(
		fx.resolve("glow", glow, {
			available: paintedSurface,
			fxDefault: variant === "default",
		})
	);
	const useShimmer = $derived(fx.resolve("shimmer", shimmer));
	const useTilt = $derived(fx.resolve("tilt", tilt, { available: largeEnoughToTilt }));
	const useMagnet = $derived(fx.resolve("magnet", magnet));

	const classes = $derived(
		cn(
			buttonVariants({
				variant,
				size,
				gradient: useGradient,
				glow: useGlow,
				shimmer: useShimmer,
				tilt: useTilt,
				magnet: useMagnet,
			}),
			className
		)
	);
</script>

<!--
	The attachment lists are duplicated across the two branches rather than
	spread through `createAttachmentKey`, because generating attachment keys
	inside a `$derived` would mint new symbols on every change and tear every
	attachment down and back up. Upstream duplicates the two branches too.
-->
{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={classes}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
		{@attach pressEffect({ enabled: () => !disabled })}
		{@attach useGlow ? glowEffect() : undefined}
		{@attach useTilt ? tiltEffect() : undefined}
		{@attach useMagnet ? magnetEffect() : undefined}
		{@attach useShimmer ? shimmerEffect({ trigger: "hover" }) : undefined}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={classes}
		{type}
		{disabled}
		{...restProps}
		{@attach pressEffect({ enabled: () => !disabled })}
		{@attach useGlow ? glowEffect() : undefined}
		{@attach useTilt ? tiltEffect() : undefined}
		{@attach useMagnet ? magnetEffect() : undefined}
		{@attach useShimmer ? shimmerEffect({ trigger: "hover" }) : undefined}
	>
		{@render children?.()}
	</button>
{/if}
