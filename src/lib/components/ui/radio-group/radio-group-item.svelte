<script lang="ts" module>
	import type { Snippet } from "svelte";
	import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
	import type { WithoutChildrenOrChild } from "$lib/utils.js";

	type ItemBase = WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps>;

	interface CardSlots {
		label?: Snippet;
		description?: Snippet;
	}

	interface CardEffects {
		gradient?: boolean;
		glow?: boolean;
		tilt?: boolean;
	}

	/**
	 * §5 collapses `radio`, `radio-card`, `radio-group` and `radio-group-cards`
	 * into `RadioGroup` + this item with a `card` variant. Four separate
	 * components is how you end up with four inconsistent implementations of the
	 * same roving-tabindex handling — which bits-ui already owns here.
	 *
	 * As with Checkbox, the effect props exist only on `variant="card"`.
	 */
	export type RadioGroupItemProps = ItemBase &
		(
			| ({ variant?: "default" } & { [K in keyof CardEffects | keyof CardSlots]?: never })
			| ({ variant: "card" } & CardEffects & CardSlots)
		);
</script>

<!--
	alrein-ui RadioGroupItem — a strict superset of the shadcn-svelte item.

	The dot is a **toggle thumb**, the same mechanic as the Checkbox mark, and the
	second of the two sites SPEC.md §2 permits an overshoot curve on.
-->
<script lang="ts">
	import CircleIcon from "@lucide/svelte/icons/circle";
	import { cn } from "$lib/utils.js";
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { getRadioGroupValue } from "./context.svelte.js";
	import { glow as glowEffect } from "$lib/fx/glow.js";
	import { press as pressEffect } from "$lib/fx/press.js";
	import { tilt as tiltEffect } from "$lib/fx/tilt.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		label,
		description,
		gradient,
		glow,
		tilt,
		...restProps
	}: RadioGroupItemProps = $props();

	const fx = getFxContext();
	const groupValue = getRadioGroupValue();
	const isCard = $derived(variant === "card");

	/*
	 * An item does not own its checked state — the group does. Comparing against
	 * the group's published value keeps one source of truth, rather than
	 * mirroring bits-ui's snippet argument into a second `$state` that can drift.
	 */
	const selected = $derived(groupValue() === restProps.value);

	const useGradient = $derived(fx.resolve("gradient", gradient, { available: isCard && selected }));
	const useGlow = $derived(fx.resolve("glow", glow, { available: isCard && selected }));
	const useTilt = $derived(fx.resolve("tilt", tilt, { available: isCard }));

	const dotClasses = $derived(
		cn(
			"flex size-4 rounded-full border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary group/radio-group-item peer relative aspect-square shrink-0 border outline-none transition-colors duration-fast ease-fx-out after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50",
			isCard && "after:hidden",
			isCard ? undefined : className
		)
	);
</script>

{#snippet dot()}
	<RadioGroupPrimitive.Item bind:ref data-slot="radio-group-item" class={dotClasses} {...restProps}>
		{#snippet children({ checked })}
			<div
				data-slot="radio-group-indicator"
				data-state={checked ? "checked" : "unchecked"}
				class="flex size-4 items-center justify-center transition-transform duration-fast ease-fx-spring data-checked:scale-100 data-unchecked:scale-0"
			>
				<CircleIcon
					class="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground"
				/>
			</div>
		{/snippet}
	</RadioGroupPrimitive.Item>
{/snippet}

{#if isCard}
	<label
		data-slot="radio-card"
		data-checked={selected ? "" : undefined}
		class={cn(
			"flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-sm text-card-foreground shadow-xs transition-colors duration-fast ease-fx-out has-data-checked:border-primary has-disabled:cursor-not-allowed has-disabled:opacity-50 fx-press",
			useGradient && "fx-gradient border-transparent text-primary-foreground",
			useGlow && "fx-glow",
			useTilt && "fx-tilt",
			className
		)}
		{@attach pressEffect()}
		{@attach useGlow ? glowEffect() : undefined}
		{@attach useTilt ? tiltEffect() : undefined}
	>
		{@render dot()}
		{#if label || description}
			<span data-slot="radio-card-text" class="grid gap-1 leading-none">
				{#if label}
					<span data-slot="radio-card-label" class="font-medium">{@render label()}</span>
				{/if}
				{#if description}
					<span
						data-slot="radio-card-description"
						class={cn("text-xs", useGradient ? "text-primary-foreground/80" : "text-muted-foreground")}
					>
						{@render description()}
					</span>
				{/if}
			</span>
		{/if}
	</label>
{:else}
	{@render dot()}
{/if}
