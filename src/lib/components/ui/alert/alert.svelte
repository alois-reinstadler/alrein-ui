<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	/**
	 * alrein-ui Alert — a strict superset of the shadcn-svelte Alert.
	 *
	 * The `default` and `destructive` class strings below are byte-identical to
	 * the file `shadcn-svelte add alert` installs, and `Alert.Title`,
	 * `Alert.Description` and `Alert.Action` are untouched upstream files. Diff
	 * against `git show 5b0c90d:src/lib/components/ui/alert/alert.svelte`.
	 *
	 * What is added:
	 *   - three variants. `warning` and `success` complete the severity set using
	 *     the `--warning` / `--success` tokens (A9 permits those two variables
	 *     because shadcn has no equivalent); `ghost` is the transparent surface
	 *     §3.1 calls a variant rather than an effect. `destructive` stays the
	 *     danger severity and keeps `--destructive`.
	 *   - the three effects §3.4 grants Alert: `gradient` ●, `glow` ◐ danger/warn,
	 *     `shimmer` ◐ once on mount. No tilt and no magnet — the props do not
	 *     exist, so `<Alert tilt />` is a compile error rather than a silently
	 *     ignored attribute.
	 *   - `dismissible` + `onDismiss`, which the upstream component has no
	 *     affordance for at all.
	 *
	 * ## Dismissal: the removal is deliberately not animated
	 *
	 * The source's whole personality is its dismissal, and it is entirely layout:
	 * JS measures the height, pins it inline, forces a reflow, then animates
	 * `height` to 0 with `padding`, `margin` and `border-width` riding along, on a
	 * 440ms *anticipation* curve — the box grows taller for a beat before it
	 * collapses. That is `F11` and `F12` together, and §2 permits overshoot on
	 * exactly two mechanics (press feedback, toggle thumbs), neither of which is
	 * this, so the curve is declined regardless of the property.
	 *
	 * A21's `grid-template-rows: 0fr ↔ 1fr` is the sanctioned replacement and it
	 * is the right mechanism — for Accordion and Sidebar submenus, where the panel
	 * **stays mounted** and only its height is in question. It is the wrong
	 * mechanism here, for a structural reason rather than a stylistic one: a
	 * collapsed-to-`0fr` alert is still in the DOM, still in the accessibility
	 * tree, and still a live region. That is precisely the defect the digest
	 * records against the source ("dismiss hides, it does not remove" —
	 * `style.display = "none"` and no way back). Buying an animation by keeping a
	 * dismissed alert alive forever is a worse trade than not animating.
	 *
	 * So dismissal here is what the digest asks for: `onDismiss` plus
	 * consumer-owned state. The alert genuinely unmounts, and it unmounts
	 * instantly. A consumer who wants the collapse owns it in one line, on a
	 * wrapper they control and can unmount —
	 * `{#if visible}<div transition:collapse><Alert … /></div>{/if}` — using the
	 * `collapse` primitive in `$lib/motion/transitions.js`, which carries the A16
	 * carve-out (the layout change *is* the animation) and says so in its own
	 * source. The demo page shows exactly that. **This file animates no layout
	 * property anywhere**; if you are reading it looking for an `F11`, there
	 * isn't one to find.
	 *
	 * ## Declined from the source, on the record rather than by omission
	 *
	 * - **Tone-driven icons baked in.** The source keeps three SVG sets mounted
	 *   and toggles them with `display`. Upstream shadcn takes the icon as a
	 *   direct child and lays it out with `has-[>svg]:grid-cols-[auto_1fr]`; a
	 *   baked-in icon would fight that selector and remove the consumer's choice.
	 * - **The auto-dismiss countdown.** It is the `banner`/`toast` skin's
	 *   behaviour, §5's inventory has no toast, and every implementation of it
	 *   needs a timer that duplicates a CSS duration (`F12`). Pausing on hover is
	 *   real usability and it is worth revisiting when a Toast exists.
	 * - **The `neon` conic ring (4.4s) and the `inline` dot pulse (1.8s).** Idle
	 *   loops on a resting state. §3.5: an idle loop means loading, or it is a
	 *   migraine.
	 * - **The "neighbour light" lamp** — a second, non-cursor proximity engine
	 *   that throws *other* elements' colours onto this one via `--lit-*`. A20
	 *   declines it library-wide; §3.1 has no entry for it and §3.4 has no row.
	 * - **Proximity glow on any tone.** §3.4 says danger/warn, and that is
	 *   evaluated below as the `available` condition rather than assumed.
	 */
	export const alertVariants = tv({
		base: "grid gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 group/alert relative w-full",
		variants: {
			variant: {
				default: "bg-card text-card-foreground",
				destructive: "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
				/*
				 * `warning` and `success` mirror `destructive`'s shape exactly — same
				 * surface, tone on the title and the icon, description one step down —
				 * so the four severities read as one family rather than as three
				 * upstream variants plus two visitors. The colours are the registered
				 * `--color-warning` / `--color-success` values, so `text-warning` and
				 * `border-warning/40` behave like any other shadcn colour (A9).
				 */
				warning: "bg-card text-warning *:data-[slot=alert-description]:text-warning/90 *:[svg]:text-current",
				success: "bg-card text-success *:data-[slot=alert-description]:text-success/90 *:[svg]:text-current",
				/*
				 * ghost — "secondary action" (§3.1). A transparent surface, which is
				 * why `gradient` and `glow` are type errors on it: there is nothing to
				 * paint and nothing to glow from.
				 */
				ghost: "border-transparent bg-transparent text-foreground",
			},
			/*
			 * The tint an effect paints with, kept in its own key rather than folded
			 * into the strings above so the two upstream variant strings stay
			 * byte-identical and a reviewer can diff them without reading around an
			 * edit. It is driven by the same value (`tint: variant`), so a danger
			 * alert glows and gradients in `--destructive` rather than in the app's
			 * primary — a red alert with a blue glow would be saying two things.
			 *
			 * A5: `--fx-tint` holds a whole colour and every alpha step downstream is
			 * `color-mix(in oklab, var(--fx-tint) N%, transparent)`, so this stays
			 * inside the OKLCH system and inherits a consumer's retheme for free.
			 */
			tint: {
				default: "",
				destructive: "[--fx-tint:var(--destructive)]",
				warning: "[--fx-tint:var(--warning)]",
				success: "[--fx-tint:var(--success)]",
				ghost: "",
			},
			/*
			 * Each effect resolves to plain utility classes, so `cn()` still merges
			 * and a consumer's `class` still wins. The prior attempt mapped every
			 * variant onto a BEM modifier and hand-wrote the CSS, which made both
			 * impossible (`F3`).
			 */
			gradient: {
				true: "fx-gradient border-transparent text-primary-foreground *:data-[slot=alert-description]:text-primary-foreground/80 *:[svg]:text-current",
			},
			/*
			 * A23: `--fx-glow-radius: 180px` is a Button-sized number. An alert is a
			 * full-width band, and the source scales its own proximity radius to 240px
			 * here. Passing it as a token override rather than as a JS argument keeps
			 * the magnitude in CSS where `F10` wants it — the pointer engine reads
			 * `--fx-glow-radius` off the element's computed style at registration.
			 */
			glow: {
				true: "fx-glow [--fx-glow-radius:240px]",
			},
			shimmer: {
				true: "fx-shimmer",
			},
			/*
			 * Room for the close button. Upstream's own `has-data-[slot=alert-action]:pr-18`
			 * is the more specific selector, so an alert with both an action row and a
			 * close button keeps upstream's wider gutter.
			 */
			dismissible: {
				true: "pr-11",
			},
		},
		defaultVariants: {
			variant: "default",
			tint: "default",
		},
	});

	export type AlertVariant = VariantProps<typeof alertVariants>["variant"];

	/** The severities §3.4 means by "danger/warn" — the only two tones glow is offered on. */
	export type AlertSeverityVariant = Extract<AlertVariant, "destructive" | "warning">;

	/**
	 * The effect props Alert is allowed, conditioned on whether its variant paints
	 * a surface.
	 *
	 * `ghost + gradient` and `ghost + glow` are contradictions and §3.5 requires
	 * them to be **type errors, not doc comments**.
	 *
	 * ## Why this is a conditional type and not a discriminated union
	 *
	 * The same reason `button.svelte` gives at length. A union of
	 * `({variant?: Painted} & Effects) | ({variant: "ghost"} & {gradient?: never})`
	 * works at a direct call site and collapses everywhere else: `Omit<ComponentProps<
	 * typeof Alert>, …>` — which is what any wrapper component does — distributes
	 * over the union and keeps only the keys common to both branches, so the
	 * exclusion silently evaporates exactly where a consumer is most likely to hit
	 * it. Keying the *effect props alone* off a generic leaves `ComponentProps` a
	 * plain object that `Omit` and spreads handle without complaint, and puts the
	 * compile error where it is needed.
	 */
	export type AlertEffects<V extends AlertVariant> = {
		/** A finite attention sweep, once when the alert mounts. Never a loop — that is Skeleton's. */
		shimmer?: boolean;
	} & (V extends "ghost"
		? { gradient?: never; glow?: never }
		: {
				/** Promotional emphasis. Accent-derived stops, never a hardcoded pair. */
				gradient?: boolean;
				/**
				 * Pointer-tracked inner highlight. §3.4 offers it on the danger and warn
				 * severities only; on `default` and `success` the prop exists but
				 * resolves to `false`, because that condition is a runtime fact about
				 * the variant rather than something the type can hold.
				 */
				glow?: boolean;
			});

	export type AlertProps<V extends AlertVariant = "default"> = WithElementRef<
		HTMLAttributes<HTMLDivElement>
	> & {
		variant?: V;
		/**
		 * Renders a close button in the top-right corner. The alert does not remove
		 * itself — see the note above: dismissal is consumer-owned state, so
		 * `onDismiss` is where you flip your own `{#if}`.
		 */
		dismissible?: boolean;
		/** Called when the close button is activated. */
		onDismiss?: () => void;
		/**
		 * Accessible name for the close button. German by default, since UI strings
		 * in this project are `de-AT` while identifiers are English.
		 */
		dismissLabel?: string;
	} & AlertEffects<V>;
</script>

<script lang="ts" generics="V extends AlertVariant = 'default'">
	import XIcon from "@lucide/svelte/icons/x";
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { glow as glowEffect } from "$lib/fx/glow.js";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { shimmer as shimmerEffect } from "$lib/fx/shimmer.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		dismissible = false,
		onDismiss,
		dismissLabel = "Schließen",
		children,
		gradient,
		glow,
		shimmer,
		...restProps
	}: AlertProps<V> = $props();

	const fx = getFxContext();

	/*
	 * The `◐ danger/warn` condition from §3.4. Only the component can evaluate
	 * it, so it is passed to `resolve` as `available` rather than the context
	 * guessing — and it is the whole reason `glow` may exist as a prop on a
	 * variant it will never light up on.
	 *
	 * `fxDefault` is what lights up on its own at `data-fx="expressive"` (§3.3).
	 * A severity alert claims one: it is by definition the highest-intent thing
	 * on the surface, which is exactly what §3.1 says glow means. At `calm` — the
	 * default, and what every business app runs — nothing happens unless asked.
	 */
	const severity = $derived(variant === "destructive" || variant === "warning");
	const paintedSurface = $derived(variant !== "ghost");

	const useGradient = $derived(fx.resolve("gradient", gradient, { available: paintedSurface }));
	const useGlow = $derived(
		fx.resolve("glow", glow, { available: paintedSurface && severity, fxDefault: true })
	);
	const useShimmer = $derived(fx.resolve("shimmer", shimmer));

	/*
	 * The source announces every alert with `role="alert"`, which is an assertive
	 * live region: "Ihr Entwurf wurde gespeichert" interrupts a screen-reader user
	 * mid-sentence. Its own `toast` skin gets this right with `role="status"`, and
	 * the digest's reading is that only the danger tone earns assertive.
	 *
	 * This is the one place the superset changes an upstream default rather than
	 * adding to it, and it is a deliberate, narrow correction: the announcement
	 * *politeness* of a non-destructive alert. Nothing visual changes, nothing
	 * stops compiling, and `role` is declared before `{...restProps}`, so a
	 * consumer who wants the old behaviour writes `role="alert"` and gets it.
	 */
	const role = $derived(variant === "destructive" ? "alert" : "status");

	const classes = $derived(
		cn(
			alertVariants({
				variant,
				tint: variant,
				gradient: useGradient,
				glow: useGlow,
				shimmer: useShimmer,
				dismissible,
			}),
			className
		)
	);
</script>

<div
	bind:this={ref}
	data-slot="alert"
	data-variant={variant}
	{role}
	class={classes}
	{...restProps}
	{@attach useGlow ? glowEffect() : undefined}
	{@attach useShimmer ? shimmerEffect({ trigger: "mount" }) : undefined}
>
	{@render children?.()}
	{#if dismissible}
		<!--
			A real <button>, focusable and in the tab order. A15's rule: the source's
			mouse-only affordances are not inherited. It sits outside the grid via
			`absolute`, so adding it never changes the row layout the upstream
			`has-[>svg]` selectors set up.
		-->
		<button
			type="button"
			data-slot="alert-dismiss"
			aria-label={dismissLabel}
			onclick={onDismiss}
			class="absolute top-2.5 right-3 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-current opacity-70 transition-opacity duration-fast ease-fx-out outline-none hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 fx-press"
			{@attach pressEffect()}
		>
			<XIcon class="size-4" />
		</button>
	{/if}
</div>
