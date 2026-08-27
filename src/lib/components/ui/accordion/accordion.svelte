<script lang="ts" module>
	import { getContext, hasContext, setContext } from "svelte";
	import { tv, type VariantProps } from "tailwind-variants";
	import type { Accordion as AccordionNamespace } from "bits-ui";
	import { cn } from "$lib/utils.js";

	/**
	 * alrein-ui Accordion — a strict superset of the shadcn-svelte Accordion.
	 *
	 * All four upstream pieces (`Root`, `Item`, `Trigger`, `Content`) are still
	 * here under the same names, the same props and the same `data-slot` values.
	 * Diff against `git show ff42eae:src/lib/components/ui/accordion/`.
	 *
	 * What is added:
	 *   - `variant="ghost"` on the root. §3.1 calls ghost a *variant*, not an
	 *     effect, and §3.4 grants it to Accordion. It removes the dividers and
	 *     gives each header its own hover surface instead.
	 *   - the two effects §3.4 grants: `gradient` ◐ **header only** and `glow` ◐
	 *     **trigger only**. Both live on `Accordion.Trigger`, because that is the
	 *     element the matrix names — the source puts its glow layer on the whole
	 *     item and lights the open panel with it, which is the thing the digest
	 *     tells us to scope back down.
	 *   - the A21 collapse. See `accordion-content.svelte`.
	 *
	 * No shimmer, no tilt, no magnet: the props do not exist, so `<Accordion.Trigger
	 * tilt />` is a compile error rather than a silently ignored attribute.
	 *
	 * ## Why the variant travels in context rather than in CSS
	 *
	 * `ghost + gradient` is a contradiction (§3.5) and it wants to be a type
	 * error. It cannot be one here: the variant is declared on `Accordion.Root`
	 * and the effect on `Accordion.Trigger`, and no type system sees across two
	 * separate components in a consumer's markup. So the root publishes its
	 * variant and the trigger passes `available: variant !== "ghost"` into
	 * `FxContext.resolve` — the same `◐`-condition mechanism Alert and Card use,
	 * evaluated where the fact actually lives.
	 *
	 * The alternative — styling the children from the root's class string with
	 * `[&_[data-slot=accordion-item]]:border-b-0` — loses on specificity to
	 * upstream's own `not-last:border-b`, and winning it back would need
	 * `!important`, which is `F17`.
	 *
	 * ## Declined from the source, on the record rather than by omission
	 *
	 * - **The overshoot on the panel.** 1.8 in five skins, 2.2 in `bounce`. A21
	 *   declines it: overshooting `0fr → 1fr` opens the panel taller than its own
	 *   content and settles back.
	 * - **The cursor light on the header title** — a pointer-tracked
	 *   `background-clip: text` radial at a 220px radius, plus a `--lit`-driven
	 *   `text-shadow`. That is a **glow**, and A20 declines it across all four
	 *   navigation components at once rather than four times over.
	 * - **The "neighbour light" lamp.** A20: no §3.1 entry, no §3.4 row.
	 * - **`glow`'s conic ring, 3.2s spinning while the panel is open.** §3.5: an
	 *   idle loop means loading, or it is a migraine.
	 * - **The 3D press.** A10/A20. The source's own majority — Chip, Tabs,
	 *   Accordion, Rating — sinks with a flat scale, and that is what `fx-press`
	 *   already does. Accordion's `scale(0.985)` is the flattest of the four.
	 */
	export const accordionVariants = tv({
		base: "cn-accordion flex w-full flex-col",
		variants: {
			variant: {
				default: "",
				/* No dividers; the headers carry their own surface instead. */
				ghost: "gap-1",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type AccordionVariant = NonNullable<VariantProps<typeof accordionVariants>["variant"]>;

	export interface AccordionContext {
		readonly variant: AccordionVariant;
	}

	const KEY = Symbol("alrein-accordion");

	export function setAccordionContext(context: AccordionContext): void {
		setContext(KEY, context);
	}

	/**
	 * Falls back to `default` when a sub-component is used outside a root, which
	 * is what a consumer composing their own wrapper will hit. Upstream's own
	 * pieces work standalone, so ours have to as well.
	 */
	export function getAccordionContext(): AccordionContext {
		if (hasContext(KEY)) return getContext<AccordionContext>(KEY);
		return { variant: "default" };
	}

	export type AccordionProps = AccordionNamespace.RootProps & {
		/** `ghost` is the transparent, divider-less surface §3.1 calls a variant. */
		variant?: AccordionVariant;
	};
</script>

<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		value = $bindable(),
		variant = "default",
		class: className,
		...restProps
	}: AccordionProps = $props();

	setAccordionContext({
		get variant() {
			return variant;
		},
	});
</script>

<AccordionPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="accordion"
	data-variant={variant}
	class={cn(accordionVariants({ variant }), className)}
	{...restProps}
/>
