<!--
	alrein-ui RadioGroup — a strict superset of the shadcn-svelte RadioGroup.

	Identical to upstream except that it publishes its current value to its items,
	which the `card` variant needs in order to resolve selected-only effects.
-->
<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { setRadioGroupValue } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(""),
		...restProps
	}: RadioGroupPrimitive.RootProps = $props();

	// Items with `variant="card"` need to know whether they are selected before
	// they render, to resolve the `◐ selected` condition on gradient and glow.
	setRadioGroupValue(() => value);
</script>

<RadioGroupPrimitive.Root
	bind:ref
	bind:value
	data-slot="radio-group"
	class={cn("grid gap-3 w-full", className)}
	{...restProps}
/>
