<!--
	alrein-ui Checkbox — a strict superset of the shadcn-svelte Checkbox.

	The mark is a **toggle thumb**: with press feedback it is one of exactly two
	things SPEC.md §2 permits `--ease-fx-spring` on, and `bans:check` allowlists
	this file for that alone. Upstream renders the mark with `transition-none`,
	so it pops in; here it scales from 0 with a small overshoot, which is what
	makes the tick read as landing in the box.

	Behaviour, keyboard handling and ARIA all still come from bits-ui.
-->
<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import CheckIcon from '@lucide/svelte/icons/check';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		"flex size-4 items-center justify-center rounded-[4px] border border-input shadow-xs transition-shadow group-has-disabled/field:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary peer relative shrink-0 outline-none transition-colors duration-fast ease-fx-out after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="[&>svg]:size-3.5 grid place-content-center text-current transition-transform duration-fast ease-fx-spring data-checked:scale-100 data-unchecked:scale-0"
			data-state={checked ? "checked" : indeterminate ? "indeterminate" : "unchecked"}
		>
			{#if checked}
				<CheckIcon  />
			{:else if indeterminate}
				<MinusIcon  />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
