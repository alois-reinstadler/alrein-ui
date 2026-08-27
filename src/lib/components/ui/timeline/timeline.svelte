<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";

	/**
	 * alrein-ui Timeline. New — shadcn-svelte has no equivalent.
	 *
	 * §5 collapses vuesax's `timeline-compact` into `variant="compact"`.
	 *
	 * **§3.4 has no row for Timeline, which means no decorative effects at all.**
	 * That is the matrix's own convention for anything unlisted, and it is right
	 * here: a timeline is a record of what happened, and emphasis on a past event
	 * is emphasis on nothing actionable.
	 *
	 * ## What is declined from the source
	 *
	 * The base component is clean — its connector animates `background` and
	 * nothing else. Two skins are not (layout inventory rows 27 and 28):
	 *
	 * - `gradient` animates the rail fill's **`height`** and the head puck's
	 *   **`margin-top`**. Re-expressed here as `scaleY` from the top and a
	 *   `translateY`. The *measurement* is kept, because it is what makes the fill
	 *   stop **between** two markers rather than snapping to one: `progress` is
	 *   fractional and its remainder interpolates between marker centres.
	 * - `alternating` animates the spine fill's `height`. Same `scaleY` answer.
	 *
	 * The source also puts a 200px proximity glow on items (A23) and a
	 * `background-clip: text` cursor light on labels (A20). Both are glow, and the
	 * matrix gives Timeline none.
	 */
	export const timelineVariants = tv({
		slots: {
			root: "relative flex flex-col",
			item: "group/timeline-item relative flex gap-4 pb-6 last:pb-0",
			marker:
				"relative z-10 mt-0.5 flex size-3 shrink-0 items-center justify-center rounded-full border-2 border-background bg-border transition-colors duration-base ease-fx-out",
			content: "min-w-0 flex-1",
			title: "text-sm font-medium",
			description: "text-sm text-muted-foreground",
			time: "text-xs text-muted-foreground tabular-nums",
			rail: "absolute top-3 bottom-0 left-1.5 w-px -translate-x-1/2 bg-border",
			/*
			 * `scaleY` from the top, not an animated `height`. The source animates
			 * height over 620ms; §1 forbids it and this is the same picture.
			 */
			railFill: "absolute inset-0 origin-top bg-primary transition-transform duration-slow ease-fx-out",
		},
		variants: {
			variant: {
				default: {},
				/* Tighter rhythm and no descriptions. A density, not a different component. */
				compact: {
					item: "gap-3 pb-3",
					title: "text-xs",
					marker: "size-2 mt-1",
					rail: "left-1",
				},
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type TimelineVariants = VariantProps<typeof timelineVariants>;
	export type TimelineVariant = NonNullable<TimelineVariants["variant"]>;
	export type TimelineTone = "default" | "success" | "warning" | "danger";

	export interface TimelineEntry {
		title: string;
		description?: string;
		/** Rendered verbatim. Format it with `Intl.DateTimeFormat('de-AT')` at the call site. */
		time?: string;
		tone?: TimelineTone;
		/**
		 * Marks the entry as done. The source strikes the title through — that is a
		 * semantic claim ("this was a task and it is finished"), not styling, so it
		 * is opt-in here rather than inherited.
		 */
		done?: boolean;
	}

	export type TimelineProps = WithElementRef<HTMLAttributes<HTMLOListElement>> & {
		entries: TimelineEntry[];
		variant?: TimelineVariant;
		/**
		 * How far the rail is filled, as a fractional entry index.
		 *
		 * `2` fills to the third marker's centre; `2.5` stops **between** the third
		 * and fourth. Keeping the fractional part is the whole reason the source
		 * measures anything here, and it is worth keeping.
		 */
		progress?: number;
		label?: string;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		entries,
		variant = "default",
		progress,
		label = "Verlauf",
		class: className,
		...restProps
	}: TimelineProps = $props();

	const classes = $derived(timelineVariants({ variant }));

	/*
	 * The fill's scale, 0–1. Each entry occupies one segment of the rail, so the
	 * fractional part of `progress` interpolates within a segment — which is what
	 * makes the fill stop between two markers instead of snapping to one.
	 */
	const fillScale = $derived.by(() => {
		if (progress === undefined || entries.length < 2) return 0;
		const clamped = Math.max(0, Math.min(progress, entries.length - 1));
		return clamped / (entries.length - 1);
	});

	const TONE: Record<TimelineTone, string> = {
		default: "bg-primary",
		success: "bg-success",
		warning: "bg-warning",
		danger: "bg-destructive",
	};
</script>

<ol
	bind:this={ref}
	data-slot="timeline"
	data-variant={variant}
	aria-label={label}
	class={cn(classes.root(), className)}
	{...restProps}
>
	{#if entries.length > 1}
		<div data-slot="timeline-rail" aria-hidden="true" class={classes.rail()}>
			{#if progress !== undefined}
				<div
					data-slot="timeline-rail-fill"
					class={classes.railFill()}
					style="scale: 1 {fillScale}"
				></div>
			{/if}
		</div>
	{/if}

	{#each entries as entry, index (entry.title + index)}
		{@const reached = progress !== undefined && index <= progress}
		<li data-slot="timeline-item" data-tone={entry.tone ?? "default"} class={classes.item()}>
			<span
				data-slot="timeline-marker"
				aria-hidden="true"
				class={cn(classes.marker(), reached && TONE[entry.tone ?? "default"])}
			></span>

			<div data-slot="timeline-content" class={classes.content()}>
				<div class="flex flex-wrap items-baseline justify-between gap-x-3">
					<span
						data-slot="timeline-title"
						class={cn(classes.title(), entry.done && "text-muted-foreground line-through")}
					>
						{entry.title}
					</span>
					{#if entry.time}
						<time data-slot="timeline-time" class={classes.time()}>{entry.time}</time>
					{/if}
				</div>
				{#if entry.description && variant !== "compact"}
					<p data-slot="timeline-description" class={cn(classes.description(), "mt-0.5")}>
						{entry.description}
					</p>
				{/if}
			</div>
		</li>
	{/each}
</ol>
