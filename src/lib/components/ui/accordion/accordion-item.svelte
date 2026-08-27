<script lang="ts">
	/**
	 * alrein-ui Accordion.Item — upstream's file plus the `ghost` variant.
	 *
	 * Upstream's whole class string is `not-last:border-b`. That divider is what
	 * `ghost` removes, and it is removed by *not emitting it* rather than by
	 * overriding it: `[&_[data-slot=accordion-item]]:border-b-0` written on the
	 * root would tie on specificity with `&:not(:last-child)` and lose or win by
	 * stylesheet order, and forcing it would mean `!important` (`F17`).
	 *
	 * The variant arrives through the context `accordion.svelte` publishes, so a
	 * consumer never passes it twice.
	 */
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { getAccordionContext, setAccordionItemIds } from "./accordion.svelte";

	const uid = $props.id();

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AccordionPrimitive.ItemProps = $props();

	const accordion = getAccordionContext();

	/*
	 * One id per item, published for the trigger's `aria-controls` and used as the
	 * panel's own id. bits-ui does not link the two — see `accordion.svelte` for
	 * the check and the reasoning.
	 */
	setAccordionItemIds({ contentId: `${uid}-content` });
</script>

<AccordionPrimitive.Item
	bind:ref
	data-slot="accordion-item"
	class={cn(accordion.variant === "ghost" ? "rounded-lg" : "not-last:border-b", className)}
	{...restProps}
/>
