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
	 *   - `fx-press-tilt` on the base (A10a). The source tips a control *toward*
	 *     the press point instead of scaling it flat, and that is Button's most
	 *     recognisable piece of feedback. It applies only while `:active` and
	 *     never on `[aria-haspopup]`, so the `perspective()` containing block A10
	 *     was protecting portals from exists for the length of a press and never
	 *     on a trigger — the same set this base already excludes from its press
	 *     nudge one line below.
	 *   - five effect variants, each resolving to Tailwind utility classes so
	 *     `cn()` still merges and a consumer's `class` still wins (A2).
	 *
	 * §3.4 permits Button: gradient (primary only), glow (primary/accent),
	 * shimmer (triggered), tilt (size >= md, standalone), magnet (expressive
	 * only). Those conditions are evaluated below; the effect props simply do not
	 * exist on components the matrix does not permit them for.
	 */
	export const buttonVariants = tv({
		base: "rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 fx-press fx-press-tilt",
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

	/**
	 * The effect props Button is allowed, conditioned on whether its variant
	 * paints a surface.
	 *
	 * `ghost + gradient` and `ghost + glow` are contradictions — a transparent
	 * surface has nothing to paint and nothing to glow from — so SPEC.md §3.5
	 * requires them to be **type errors, not doc comments**. `link` is included
	 * for the same reason.
	 *
	 * ## Why this is a conditional type and not a discriminated union
	 *
	 * The obvious encoding is `Base & ({variant?: Painted} & Effects | {variant:
	 * "ghost"} & {gradient?: never})`. It works at a direct call site and breaks
	 * everywhere else: `Omit<ComponentProps<typeof Button>, "href">` — which is
	 * exactly what shadcn's own `InputGroupButton` does — collapses a union to the
	 * intersection of its keys, and intersecting two branches with the full
	 * `HTMLButtonAttributes & HTMLAnchorAttributes` surface produces "union type
	 * that is too complex to represent".
	 *
	 * A wrapper component spreading props into Button is a normal shadcn pattern,
	 * and §1's "an existing shadcn call site must compile unchanged" is the
	 * stronger of the two rules. Keying the *effect props alone* off a generic
	 * keeps the compile error where it is needed and leaves `ComponentProps` a
	 * plain object that `Omit` and spreads handle without complaint.
	 */
	export type ButtonEffects<V extends ButtonVariant> = {
		/** A finite attention sweep on hover. Not the loading loop — that is Skeleton's. */
		shimmer?: boolean;
		/** "A discrete object you can pick up." Needs a real hit area, so size >= default. */
		tilt?: boolean;
		/** The unmissable single CTA. `data-fx="expressive"` only, never in chrome, a form or a list. */
		magnet?: boolean;
	} & (V extends "ghost" | "link"
		? { gradient?: never; glow?: never }
		: {
				/** Primary emphasis. Accent-derived stops, never a hardcoded pair. */
				gradient?: boolean;
				/** "Highest-intent target on this surface." Pointer-tracked. */
				glow?: boolean;
			});

	type ButtonBase = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & { size?: ButtonSize };

	export type ButtonProps<V extends ButtonVariant = "default"> = ButtonBase & {
		variant?: V;
		/**
		 * Determinate upload/work progress, 0–1. Omit (or pass `null`) for an
		 * ordinary button.
		 *
		 * §5 pairs this with `UploadArea` on one shared `UploadState`: a dropzone
		 * and a button that uploads are the same state machine wearing different
		 * clothes. Pass `state.progress` straight through.
		 *
		 * It is **not** an effect and does not consult `FxContext`. §3.4 governs
		 * decoration; this is state, and §3.5 forbids state ever being carried by
		 * something `data-fx="off"` can switch off. It is also not a disabled
		 * state — cancelling an upload is a legitimate thing to click — so the
		 * button stays interactive unless the caller disables it.
		 */
		progress?: number | null;
	} & ButtonEffects<V>;

	/**
	 * The progress fill. A child element rather than a pseudo-element because
	 * Button has neither left: `fx-glow` owns `::before` and `fx-press` owns
	 * `::after`, and `background-image` on the button itself belongs to gradient
	 * and shimmer.
	 *
	 * The fill is a solid gradient image sized to a fraction of the span, so the
	 * only animated property is `background-size` — paint, never the layout box
	 * (§1). Sizing it beats `scaleX` here: a scaled box drags its own rounded
	 * corners with it, whereas a background is clipped by the span's inherited
	 * radius on the left and ends in a hard vertical edge on the right, which is
	 * what a progress fill looks like.
	 *
	 * `z-index: -1` puts it above the button's background and below the label —
	 * a positioned child would otherwise paint a wash over the text. That needs
	 * the button to be a positioned, isolated ancestor, which is why `progress`
	 * adds `relative isolate`; neither moves anything, so it is not an `F11`
	 * layout change.
	 */
	const BUTTON_PROGRESS_FILL =
		"pointer-events-none absolute inset-0 z-[-1] rounded-[inherit] bg-no-repeat opacity-20 " +
		"[background-image:linear-gradient(currentColor,currentColor)] " +
		"[background-size:calc(var(--button-progress)*100%)_100%] " +
		"transition-[background-size] duration-base ease-fx-out";
</script>

<script lang="ts" generics="V extends ButtonVariant = 'default'">
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
		progress = null,
		gradient,
		glow,
		shimmer,
		tilt,
		magnet,
		...restProps
	}: ButtonProps<V> = $props();

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

	/*
	 * Clamped rather than trusted: `UploadState.progress` is a mean over items and
	 * a caller doing its own bookkeeping can hand over 1.02 or a NaN from a
	 * division by zero. A fill wider than the button is a rendering bug reported
	 * as a design bug, and it costs one line to make impossible.
	 */
	const fill = $derived(
		typeof progress === "number" && Number.isFinite(progress)
			? Math.min(1, Math.max(0, progress))
			: null
	);

	const classes = $derived(
		cn(
			fill !== null && "relative isolate",
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
	Decorative and already announced: the label carries the percentage, so a
	second reading of the same number is noise. `aria-busy` on the control is the
	part a screen reader needs.
-->
{#snippet progressFill()}
	<span
		data-slot="button-progress"
		aria-hidden="true"
		class={BUTTON_PROGRESS_FILL}
		style="--button-progress: {fill}"
	></span>
{/snippet}

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
		aria-busy={fill !== null ? "true" : undefined}
		{...restProps}
		{@attach pressEffect({ enabled: () => !disabled })}
		{@attach useGlow ? glowEffect() : undefined}
		{@attach useTilt ? tiltEffect() : undefined}
		{@attach useMagnet ? magnetEffect() : undefined}
		{@attach useShimmer ? shimmerEffect({ trigger: "hover" }) : undefined}
	>
		{#if fill !== null}{@render progressFill()}{/if}
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={classes}
		{type}
		{disabled}
		aria-busy={fill !== null ? "true" : undefined}
		{...restProps}
		{@attach pressEffect({ enabled: () => !disabled })}
		{@attach useGlow ? glowEffect() : undefined}
		{@attach useTilt ? tiltEffect() : undefined}
		{@attach useMagnet ? magnetEffect() : undefined}
		{@attach useShimmer ? shimmerEffect({ trigger: "hover" }) : undefined}
	>
		{#if fill !== null}{@render progressFill()}{/if}
		{@render children?.()}
	</button>
{/if}
