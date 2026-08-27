<script lang="ts" module>
	import { tv } from "tailwind-variants";
	import type { Accordion as AccordionNamespace } from "bits-ui";
	import type { WithoutChild } from "$lib/utils.js";

	/**
	 * alrein-ui Accordion.Trigger — upstream's file plus the two effects §3.4
	 * grants Accordion, and the chevron's rotation.
	 *
	 * The upstream `base:` string below is byte-identical to
	 * `git show ff42eae:src/lib/components/ui/accordion/accordion-trigger.svelte`
	 * apart from the appended `fx-press`. Everything else is a new variant key, so
	 * a reviewer can diff the two strings without reading around an edit.
	 *
	 * ## Why both effects live on the trigger
	 *
	 * §3.4 reads `gradient ◐ header only · glow ◐ trigger`. This component renders
	 * the header *and* the trigger — upstream wraps `AccordionPrimitive.Trigger`
	 * in `AccordionPrimitive.Header` — and the trigger fills the header, so
	 * painting the trigger paints the header row. The distinction the matrix is
	 * drawing is header **versus panel**, and the source is on the wrong side of
	 * it: it puts its glow layer on the whole item, which lights the open panel
	 * too. That is the thing being scoped back down here.
	 *
	 * ## The chevron
	 *
	 * Upstream ships two icons and swaps them with `hidden`; two icons cannot
	 * animate into each other, so the source's rotating chevron would be lost.
	 * This renders one `ChevronDownIcon` that rotates 180°, which is visually
	 * identical in both resting states — a rotated chevron-down *is* a chevron-up
	 * — and keeps the `data-slot="accordion-trigger-icon"` hook, so upstream's own
	 * `**:data-[slot=accordion-trigger-icon]:*` selectors still match. This is the
	 * one place the superset changes upstream's DOM rather than adding to it, and
	 * it is recorded here rather than discovered in a diff.
	 *
	 * The source runs the chevron at 540ms against a 600ms panel, so it visibly
	 * lags the opening. **Declined**: §2's scale stops at `slow`, there is no
	 * token slower than the panel's own, and inventing one to buy a lag is `F5`.
	 * The chevron runs on the same `duration-slow ease-fx-out` as the panel.
	 */
	export const accordionTriggerVariants = tv({
		base: "rounded-md py-4 text-left text-sm font-medium hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-all outline-none disabled:pointer-events-none disabled:opacity-50 fx-press",
		variants: {
			variant: {
				default: "",
				/*
				 * ghost — the divider is gone, so the header needs its own surface to
				 * read as a hit target. An underline on a transparent row plus no
				 * surface is two weak signals instead of one clear one.
				 */
				ghost: "px-3 hover:bg-muted/50 hover:no-underline",
			},
			gradient: {
				true: "fx-gradient border-transparent text-primary-foreground **:data-[slot=accordion-trigger-icon]:text-current hover:no-underline",
			},
			/*
			 * A23: `--fx-glow-radius: 180px` is a Button-sized number. An accordion
			 * header is a full-width row and the source scales its own proximity
			 * radius to 220px here. It is passed as a token override rather than as a
			 * JS argument so the magnitude stays in CSS, where `F10` wants it — the
			 * pointer engine reads `--fx-glow-radius` off the computed style.
			 */
			glow: {
				true: "fx-glow [--fx-glow-radius:220px]",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type AccordionTriggerProps = WithoutChild<AccordionNamespace.TriggerProps> & {
		level?: AccordionNamespace.HeaderProps["level"];
		/** Promotional emphasis on the header row. §3.4: header only, never the panel. */
		gradient?: boolean;
		/** "The highest-intent target on this surface." Pointer-tracked, scoped to the trigger. */
		glow?: boolean;
	};
</script>

<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import { cn } from "$lib/utils.js";
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { glow as glowEffect } from "$lib/fx/glow.js";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { getAccordionContext, getAccordionItemIds } from "./accordion.svelte";

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		children,
		gradient,
		glow,
		disabled,
		...restProps
	}: AccordionTriggerProps = $props();

	const fx = getFxContext();
	const accordion = getAccordionContext();
	/*
	 * bits-ui emits `aria-expanded` and stops there — no `aria-controls`. The item
	 * publishes an id so the two ends of the disclosure are linked; see
	 * `accordion.svelte` for the check against `bits-ui@2.19.0`. Declared before
	 * `{...restProps}` below, so a consumer can still override it.
	 */
	const itemIds = getAccordionItemIds();

	/*
	 * `ghost + gradient` and `ghost + glow` are contradictions (§3.5): a
	 * transparent surface has nothing to paint and nothing to glow from. On
	 * Button and Alert that is a type error, because the variant and the effect
	 * are props of one component. Here they are not — the variant belongs to
	 * `Accordion.Root` and the effect to `Accordion.Trigger` — so it is enforced
	 * as an `◐` availability condition instead, which is the same §3.2 chain,
	 * evaluated where the fact lives.
	 *
	 * No `fxDefault`: an accordion header is a list of peers, and §3.1 says glow
	 * means "the highest-intent target on this surface". Six of them lighting up
	 * at `expressive` would be six claims of primacy.
	 */
	const paintedSurface = $derived(accordion.variant !== "ghost");

	const useGradient = $derived(fx.resolve("gradient", gradient, { available: paintedSurface }));
	const useGlow = $derived(fx.resolve("glow", glow, { available: paintedSurface }));

	const classes = $derived(
		cn(
			accordionTriggerVariants({
				variant: accordion.variant,
				gradient: useGradient,
				glow: useGlow,
			}),
			className
		)
	);
</script>

<AccordionPrimitive.Header {level} data-slot="accordion-header" class="flex">
	<AccordionPrimitive.Trigger
		bind:ref
		data-slot="accordion-trigger"
		class={classes}
		aria-controls={itemIds?.contentId}
		{disabled}
		{...restProps}
		{@attach pressEffect({ enabled: () => !disabled })}
		{@attach useGlow ? glowEffect() : undefined}
	>
		{@render children?.()}
		<!--
			`rotate` rather than `transform`: Tailwind v4's `rotate-180` sets the
			standalone `rotate` property, so this composes with `fx-press`'s `scale`
			instead of overwriting it. Rotation is paint-adjacent — it moves nothing
			in the layout box (§1).
		-->
		<ChevronDownIcon
			data-slot="accordion-trigger-icon"
			class="cn-accordion-trigger-icon pointer-events-none shrink-0 transition-[rotate] duration-slow ease-fx-out group-aria-expanded/accordion-trigger:rotate-180"
		/>
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
