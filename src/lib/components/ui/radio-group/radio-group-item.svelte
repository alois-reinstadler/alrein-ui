<!--
	alrein-ui RadioGroupItem — a strict superset of the shadcn-svelte item.

	The dot is a **toggle thumb**, the same mechanic as the Checkbox mark, and
	the second of the two sites SPEC.md §2 permits an overshoot curve on.
-->
<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
	import CircleIcon from '@lucide/svelte/icons/circle';
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> = $props();
</script>

<RadioGroupPrimitive.Item
	bind:ref
	data-slot="radio-group-item"
	class={cn(
		"flex size-4 rounded-full border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary group/radio-group-item peer relative aspect-square shrink-0 border outline-none transition-colors duration-fast ease-fx-out after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<div
			data-slot="radio-group-indicator"
			data-state={checked ? "checked" : "unchecked"}
			class="flex size-4 items-center justify-center transition-transform duration-fast ease-fx-spring data-checked:scale-100 data-unchecked:scale-0"
		>
			{#if checked}
				<CircleIcon class="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
			{/if}
		</div>
	{/snippet}
</RadioGroupPrimitive.Item>
