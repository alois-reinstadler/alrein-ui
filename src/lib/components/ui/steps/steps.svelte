<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";
	import type { WithElementRef } from "$lib/utils.js";

	/**
	 * alrein-ui Steps. New — shadcn-svelte has no equivalent.
	 *
	 * §5 collapses vuesax's `steps` and `steps-arrow` into one component with a
	 * `variant`. §3.4 grants **`gradient` on the active step and nothing else**:
	 * no glow, no shimmer, no tilt, no magnet.
	 *
	 * ## Not a MorphIndicator consumer (A18)
	 *
	 * §4.9 listed Steps as one, and that was wrong. There is no sliding indicator
	 * anywhere in the source or its five skins — progress is a per-segment
	 * `scaleX` on each connector plus a `stroke-dashoffset` ring on the marker.
	 * Both are already transform-only and already §1-clean, so there is nothing
	 * for a FLIP indicator to do. Pagination is the fourth real consumer §4.9 was
	 * reaching for.
	 *
	 * ## What is declined from the source
	 *
	 * - The `pills` skin overshoots **`flex-grow`** and its label's
	 *   **`max-width: 0 → 240px`** (layout inventory rows 7 and 8). Both are layout
	 *   animations and both are declined; the label reveal, if wanted, is opacity
	 *   plus `translateX`.
	 * - The marker pop, the active-marker scale and the icon crossfade all use a
	 *   **1.56 overshoot**. Transform-only, so §1 is satisfied — but §2 restricts
	 *   overshoot to press feedback and toggle thumbs, and a step marker is
	 *   neither. They run on `ease-fx-out`.
	 * - `bar`'s `box-shadow` glow and the `box-shadow: 0 0 0 4px` rings on active
	 *   markers are out twice over: §3.4 grants Steps no glow, and §3.5 forbids any
	 *   effect that competes with the real focus ring, which a 4px ring does.
	 */
	export const stepsVariants = tv({
		slots: {
			root: "flex w-full",
			item: "group/step relative flex min-w-0 flex-1 last:flex-none",
			marker:
				"relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors duration-base ease-fx-out",
			text: "min-w-0",
			label: "text-sm font-medium transition-colors duration-base ease-fx-out",
			description: "text-xs text-muted-foreground",
			connector: "relative overflow-hidden bg-border",
			/*
			 * The fill is a `scaleX` from the left rather than an animated `width`.
			 * Same visual, and it never touches the layout box (§1). The source's
			 * `bar` skin animates width; the base component already does it this way,
			 * so this is the source's own better answer.
			 */
			fill: "absolute inset-0 origin-left bg-primary transition-transform ease-fx-out",
		},
		variants: {
			orientation: {
				horizontal: {
					root: "flex-row items-start",
					item: "flex-col items-center gap-2 text-center",
					connector: "absolute top-4 left-1/2 h-0.5 w-full -translate-y-1/2",
				},
				vertical: {
					root: "flex-col",
					item: "flex-row items-start gap-3 pb-8 last:pb-0",
					connector: "absolute top-8 left-4 h-full w-0.5 -translate-x-1/2",
					fill: "origin-top",
				},
			},
			variant: {
				line: {},
				/*
				 * `arrow` is a chevron seam between segments, drawn with clip-path —
				 * paint, not layout, so segments keep their box.
				 */
				arrow: {
					item: "flex-none",
					marker: "rounded-none border-0",
				},
			},
		},
		defaultVariants: {
			orientation: "horizontal",
			variant: "line",
		},
	});

	export type StepsVariants = VariantProps<typeof stepsVariants>;
	export type StepsOrientation = NonNullable<StepsVariants["orientation"]>;
	export type StepsVariant = NonNullable<StepsVariants["variant"]>;
	export type StepStatus = "complete" | "active" | "pending";

	export interface StepDefinition {
		label: string;
		description?: string;
		/** Replaces the step number. The check mark on a completed step always wins. */
		icon?: Snippet;
	}

	export type StepsProps = WithElementRef<HTMLAttributes<HTMLElement>> & {
		steps: StepDefinition[];
		/** Zero-based index of the active step. `steps.length` means every step is complete. */
		value?: number;
		orientation?: StepsOrientation;
		variant?: StepsVariant;
		/** Emphasis on the active step. The only effect §3.4 grants Steps. */
		gradient?: boolean;
		/**
		 * Accessible name for the list. German by default (§1.2).
		 *
		 * Steps are **not interactive**. The source makes clicking a pending or
		 * active step do nothing, and "click any step to jump there" is a different
		 * product decision rather than a missing feature — so this renders an
		 * ordered list, not a row of buttons, and adds nothing to the tab order that
		 * would not respond.
		 */
		label?: string;
	};
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import { cn } from "$lib/utils.js";
	import { getFxContext } from "$lib/fx/context.svelte.js";

	let {
		ref = $bindable(null),
		steps,
		value = 0,
		orientation = "horizontal",
		variant = "line",
		gradient,
		label = "Fortschritt",
		class: className,
		...restProps
	}: StepsProps = $props();

	const fx = getFxContext();
	const useGradient = $derived(fx.resolve("gradient", gradient));

	const classes = $derived(stepsVariants({ orientation, variant }));

	function statusOf(index: number): StepStatus {
		if (index < value) return "complete";
		if (index === value) return "active";
		return "pending";
	}

	/*
	 * Direction, so that stepping backwards reverses the *order* of the chain
	 * rather than the animation. That is what makes it read as undoing rather than
	 * as a rewind, and it is the one idea in the source's choreography worth the
	 * bookkeeping.
	 *
	 * An `$effect` because "compare against the previous value" is genuinely
	 * stateful — there is no `$derived` formulation that does not mutate in a read
	 * position. It writes one attribute and reads no DOM.
	 */
	let previous: number | undefined = $state(undefined);
	let direction = $state<"forward" | "backward">("forward");
	$effect(() => {
		if (previous !== undefined && value !== previous) {
			direction = value > previous ? "forward" : "backward";
		}
		previous = value;
	});

	/*
	 * The staged delays are the choreography — fire the connector, the ring and
	 * the marker together and it reads as a flash. Going forward the fill leads;
	 * going backward the far end drains first, so the delay is measured from the
	 * other end of the list.
	 */
	function delayFor(index: number): string {
		const position = direction === "forward" ? index : steps.length - 1 - index;
		return `calc(var(--transition-duration-instant) * ${position})`;
	}
</script>

<ol
	bind:this={ref}
	data-slot="steps"
	data-orientation={orientation}
	data-variant={variant}
	data-direction={direction}
	aria-label={label}
	class={cn(classes.root(), className)}
	{...restProps}
>
	{#each steps as step, index (step.label)}
		{@const status = statusOf(index)}
		<li
			data-slot="step"
			data-status={status}
			aria-current={status === "active" ? "step" : undefined}
			class={classes.item()}
		>
			{#if index < steps.length - 1}
				<div data-slot="step-connector" aria-hidden="true" class={classes.connector()}>
					<div
						data-slot="step-connector-fill"
						class={cn(classes.fill(), "duration-slow")}
						style="scale: {status === 'complete' ? '1 1' : orientation === 'vertical' ? '1 0' : '0 1'}; transition-delay: {delayFor(index)}"
					></div>
				</div>
			{/if}

			<span
				data-slot="step-marker"
				class={cn(
					classes.marker(),
					status === "complete" && "border-primary bg-primary text-primary-foreground",
					status === "active" && "border-primary text-primary",
					status === "pending" && "border-input text-muted-foreground",
					// §3.4's `◐ active step`: the gradient paints the current step only.
					status === "active" && useGradient && "fx-gradient border-transparent text-primary-foreground"
				)}
			>
				{#if status === "complete"}
					<CheckIcon class="size-4" />
				{:else if step.icon}
					{@render step.icon()}
				{:else}
					{index + 1}
				{/if}
			</span>

			<span data-slot="step-text" class={classes.text()}>
				<span
					data-slot="step-label"
					class={cn(classes.label(), status === "pending" && "text-muted-foreground")}
				>
					{step.label}
				</span>
				{#if step.description}
					<span data-slot="step-description" class={cn(classes.description(), "block")}>
						{step.description}
					</span>
				{/if}
			</span>

			<!--
				The status in words, for a screen reader. §3.5's accessibility floor:
				no visual treatment may be the sole carrier of state, and here the
				colour and the check mark are both visual.
			-->
			<span class="sr-only">
				{status === "complete" ? "abgeschlossen" : status === "active" ? "aktuell" : "ausstehend"}
			</span>
		</li>
	{/each}
</ol>
