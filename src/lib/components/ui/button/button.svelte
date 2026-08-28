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
	 *   - one explicit transition in place of upstream's `transition-all` (A32).
	 *     Three utilities wanted to own `transition` on this element — upstream's
	 *     `transition-all`, `fx-press`'s spring and `fx-tilt`'s — and only one can.
	 *     `transition-all` was winning, so press ran at Tailwind's 150ms default
	 *     instead of the 80ms spring §2 reserves for it, and none of the motion
	 *     scale reached the most-used component in the library. One declaration
	 *     with per-property timing settles it, and every value is a token.
	 *
	 * ## Variants, and what is left of the effect props (A31)
	 *
	 * `gradient`, `glow` and `shimmer` used to be boolean effect props. They are
	 * variants now, because that is what they always were: a surface treatment the
	 * author picks, not a motion the pointer drives. All three build on `default`
	 * — they are emphasis on the primary action, and a gradient CTA that is also
	 * secondary is not a thing anyone wants.
	 *
	 * Folding them into `variant` also deletes a whole class of type gymnastics.
	 * `ghost + gradient` was a contradiction §3.5 required to be a type error, and
	 * enforcing it needed a conditional type keyed on the variant. Mutually
	 * exclusive variants make the contradiction unrepresentable instead of merely
	 * rejected, which is the better kind of impossible.
	 *
	 * `magnet` stays a boolean effect: it is pointer-driven, `expressive`-only, and
	 * composes with whatever variant the button already has.
	 *
	 * `tilt` is gone. Cursor-following tilt belongs to Card alone now (A31); what a
	 * button does instead is tip toward the press point, always, at any size (A10a).
	 */
	export const buttonVariants = tv({
		base: "rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [transition:scale_var(--transition-duration-instant)_var(--ease-fx-spring),transform_var(--transition-duration-instant)_var(--ease-fx-out),color_var(--transition-duration-fast)_var(--ease-fx-out),background-color_var(--transition-duration-fast)_var(--ease-fx-out),border-color_var(--transition-duration-fast)_var(--ease-fx-out),box-shadow_var(--transition-duration-fast)_var(--ease-fx-out)] fx-press fx-press-tilt",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/80",
				outline: "border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
				ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
				destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
				link: "text-primary underline-offset-4 hover:underline",
				/*
				 * A31. Emphasis on top of `default`, not alternatives to it — each
				 * repeats primary's own surface so the button still reads as the
				 * primary action, then adds its treatment.
				 */
				gradient: "bg-primary text-primary-foreground hover:bg-primary/80 fx-gradient border-transparent",
				glow: "bg-primary text-primary-foreground hover:bg-primary/80 fx-glow fx-glow-bloom",
				shimmer: "bg-primary text-primary-foreground hover:bg-primary/80 fx-shimmer",
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
			 * The one effect prop left. A plain utility class, not a BEM modifier —
			 * the prior attempt mapped every variant to `rx-button--x` and hand-wrote
			 * the CSS, which meant `cn()` could not merge anything and a consumer's
			 * `class="h-12"` lost to specificity (SPEC.md §8, `F3`).
			 */
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

	/**
	 * The one effect prop Button still has (A31).
	 *
	 * This used to be a conditional type keyed on the variant, because
	 * `ghost + gradient` and `ghost + glow` are contradictions §3.5 required to be
	 * type errors rather than doc comments — a transparent surface has nothing to
	 * paint and nothing to glow from. Folding those two into `variant` makes the
	 * contradiction *unrepresentable*: you cannot be `ghost` and `gradient` at once
	 * because they are the same field.
	 *
	 * That also retires a nasty piece of type surgery. The conditional type existed
	 * to avoid a discriminated union, because `Omit<ComponentProps<typeof Button>,
	 * "href">` — which shadcn's own `InputGroupButton` does — collapses a union to
	 * the intersection of its keys and produced "union type that is too complex to
	 * represent". With one unconditional boolean left there is no union to collapse.
	 */
	export type ButtonEffects = {
		/** The unmissable single CTA. `data-fx="expressive"` only, never in chrome, a form or a list. */
		magnet?: boolean;
	};

	type ButtonBase = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & { size?: ButtonSize };

	export type ButtonProps = ButtonBase & {
		variant?: ButtonVariant;
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
	} & ButtonEffects;

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

<script lang="ts">
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { glow as glowEffect } from "$lib/fx/glow.js";
	import { magnet as magnetEffect } from "$lib/fx/magnet.js";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { shimmer as shimmerEffect } from "$lib/fx/shimmer.js";

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
		magnet,
		...restProps
	}: ButtonProps = $props();

	const fx = getFxContext();

	/*
	 * A31: the variants paint themselves. `fx-gradient`, `fx-glow` and `fx-shimmer`
	 * are on the element the moment the variant is chosen, and no longer ask
	 * `FxContext` for permission — a variant is what the author asked for, and
	 * `data-fx` governs effects.
	 *
	 * The *motion* inside two of them is still governed, and by the layer that
	 * should govern it. `glow` follows the pointer, so its attachment runs only
	 * where there is a pointer to follow; `fx.css` zeroes `--fx-glow` under
	 * `(pointer: coarse)` as the CSS-only half of the same rule. `shimmer` sweeps
	 * once, and reduced motion collapses `--fx-shimmer-sweep-duration` to 0ms.
	 * That is how §7.8 and §7.9 keep holding without `data-fx` being involved.
	 */
	const glowing = $derived(variant === "glow");
	const shimmering = $derived(variant === "shimmer");
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
			buttonVariants({ variant, size, magnet: useMagnet }),
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
		{@attach glowing ? glowEffect() : undefined}
		{@attach useMagnet ? magnetEffect() : undefined}
		{@attach shimmering ? shimmerEffect({ trigger: "hover" }) : undefined}
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
		{@attach glowing ? glowEffect() : undefined}
		{@attach useMagnet ? magnetEffect() : undefined}
		{@attach shimmering ? shimmerEffect({ trigger: "hover" }) : undefined}
	>
		{#if fill !== null}{@render progressFill()}{/if}
		{@render children?.()}
	</button>
{/if}
