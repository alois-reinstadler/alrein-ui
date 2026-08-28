<script lang="ts" module>
	import type { Snippet } from "svelte";
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import type { WithoutChildrenOrChild } from "$lib/utils.js";

	type CheckboxBase = WithoutChildrenOrChild<CheckboxPrimitive.RootProps>;

	interface CardSlots {
		/** The card's title. Ignored on the default variant, which has no surface to put it on. */
		label?: Snippet;
		/** Secondary line under the label. */
		description?: Snippet;
	}

	interface CardEffects {
		/** Emphasis on the selected card. §3.4 permits this only while checked. */
		gradient?: boolean;
		/** Pointer-tracked inner highlight on the selected card. Only while checked. */
		glow?: boolean;
	}

	/**
	 * §5 collapses `checkbox` and `checkbox-card` into one component, because
	 * building them separately is how you end up with two inconsistent
	 * implementations of the same keyboard handling.
	 *
	 * The effect props exist **only** on `variant="card"`. §3.4 gives a bare
	 * checkbox no decorative effects at all — a 16px box has nothing to glow from
	 * and nothing to tilt — so on the default variant they are typed `never` and
	 * `<Checkbox tilt />` is a compile error, per §3.5.
	 */
	export type CheckboxProps = CheckboxBase &
		(
			| ({ variant?: "default" } & { [K in keyof CardEffects | keyof CardSlots]?: never })
			| ({ variant: "card" } & CardEffects & CardSlots)
		);
</script>

<!--
	alrein-ui Checkbox — a strict superset of the shadcn-svelte Checkbox.

	The mark is a **toggle thumb**: with press feedback it is one of exactly two
	things SPEC.md §2 permits `--ease-fx-spring` on, and `bans:check` allowlists
	this file for that alone. Upstream renders the mark with `transition-none`, so
	it pops in; here it scales from 0 with a small overshoot, which is what makes
	the tick read as landing in the box.

	Behaviour, keyboard handling and ARIA all still come from bits-ui.
-->
<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import MinusIcon from "@lucide/svelte/icons/minus";
	import { cn } from "$lib/utils.js";
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import { glow as glowEffect } from "$lib/fx/glow.js";
	import { press as pressEffect } from "$lib/fx/press.js";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		variant = "default",
		label,
		description,
		gradient,
		glow,
		...restProps
	}: CheckboxProps = $props();

	const fx = getFxContext();

	/* The `◐ selected` condition from §3.4: an unselected card promises nothing. */
	const isCard = $derived(variant === "card");
	const useGradient = $derived(
		fx.resolve("gradient", gradient, { available: isCard && checked === true })
	);
	const useGlow = $derived(fx.resolve("glow", glow, { available: isCard && checked === true }));

	const boxClasses = $derived(
		cn(
			"flex size-4 items-center justify-center rounded-[4px] border border-input shadow-xs transition-shadow group-has-disabled/field:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary peer relative shrink-0 outline-none transition-colors duration-fast ease-fx-out after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50",
			// On a card the hit area is the whole card, so the box must not claim its
			// own oversized one or the two overlap and the card swallows stray clicks.
			isCard && "after:hidden",
			isCard ? undefined : className
		)
	);
</script>

{#snippet box()}
	<CheckboxPrimitive.Root
		bind:ref
		data-slot="checkbox"
		class={boxClasses}
		bind:checked
		bind:indeterminate
		{...restProps}
	>
		{#snippet children({ checked, indeterminate })}
			<div
				data-slot="checkbox-indicator"
				data-state={checked ? "checked" : indeterminate ? "indeterminate" : "unchecked"}
				class="[&>svg]:size-3.5 grid place-content-center text-current transition-transform duration-fast ease-fx-spring data-checked:scale-100 data-indeterminate:scale-100 data-unchecked:scale-0"
			>
				{#if checked}
					<CheckIcon />
				{:else if indeterminate}
					<MinusIcon />
				{/if}
			</div>
		{/snippet}
	</CheckboxPrimitive.Root>
{/snippet}

{#if isCard}
	<!--
		A native <label> wrapper, so the whole card is the hit area without a
		single line of click handling and without a `role` we would then have to
		keep honest. bits-ui still owns the control's keyboard and ARIA.
	-->
	<label
		data-slot="checkbox-card"
		data-checked={checked === true ? "" : undefined}
		class={cn(
			"flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-sm text-card-foreground shadow-xs transition-colors duration-fast ease-fx-out has-data-checked:border-primary has-disabled:cursor-not-allowed has-disabled:opacity-50 fx-press fx-press-tilt",
			useGradient && "fx-gradient border-transparent text-primary-foreground",
			useGlow && "fx-glow",
			className
		)}
		{@attach pressEffect()}
		{@attach useGlow ? glowEffect() : undefined}
	>
		{@render box()}
		{#if label || description}
			<span data-slot="checkbox-card-text" class="grid gap-1 leading-none">
				{#if label}
					<span data-slot="checkbox-card-label" class="font-medium">{@render label()}</span>
				{/if}
				{#if description}
					<span
						data-slot="checkbox-card-description"
						class={cn("text-xs", useGradient ? "text-primary-foreground/80" : "text-muted-foreground")}
					>
						{@render description()}
					</span>
				{/if}
			</span>
		{/if}
	</label>
{:else}
	{@render box()}
{/if}
