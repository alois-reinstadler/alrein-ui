<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";
	import { Tabs as TabsPrimitive } from "bits-ui";

	/**
	 * alrein-ui TabsList — a strict superset of the shadcn-svelte TabsList.
	 *
	 * `default` and `line` keep upstream's class strings; `relative` is the only
	 * addition to the base, and it is structural rather than cosmetic: it makes
	 * the list the `offsetParent` that `MorphIndicator` measures against. It
	 * cannot move anything, so it is not an `F11` layout change.
	 *
	 * Two variants are added, both of which §5 names: `chrome` and `gooey`.
	 */
	export const tabsListVariants = tv({
		base: "rounded-lg p-[3px] group-data-horizontal/tabs:h-9 data-[variant=line]:rounded-none group/tabs-list relative inline-flex w-fit items-center justify-center text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
		variants: {
			variant: {
				default: "cn-tabs-list-variant-default bg-muted",
				line: "cn-tabs-list-variant-line gap-1 bg-transparent",
				/*
				 * The browser-tab shape. The list is the "lip" — a single bottom
				 * border the sled sits on — and the sled masks the 1px of lip it
				 * covers with an `::after`, so the two read as one surface.
				 */
				chrome: "cn-tabs-list-variant-chrome items-end gap-0 rounded-none border-b bg-transparent p-0",
				gooey: "cn-tabs-list-variant-gooey gap-1 rounded-full bg-muted"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	});

	/**
	 * How the indicator is painted per variant. Every one of these is `transform`,
	 * `background`, `border` or `border-radius` — never a size — because
	 * `MorphIndicator` is already sitting at its final box and only its transform
	 * is animating (SPEC.md §1, layout inventory rows 10-14).
	 *
	 * `default` reproduces upstream's active-trigger pill exactly, so the resting
	 * frame is unchanged and only the travel between frames is new.
	 */
	export const tabsIndicatorVariants = tv({
		variants: {
			variant: {
				default: "rounded-md bg-background shadow-sm dark:border dark:border-input dark:bg-input/30",
				line: "rounded-none bg-transparent shadow-none after:absolute after:inset-x-0 after:bottom-[-5px] after:h-0.5 after:bg-foreground group-data-[orientation=vertical]/tabs:after:inset-x-auto group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:right-[-4px] group-data-[orientation=vertical]/tabs:after:h-auto group-data-[orientation=vertical]/tabs:after:w-0.5",
				chrome: "rounded-md rounded-b-none border border-b-0 border-border bg-background shadow-none after:absolute after:inset-x-0 after:bottom-[-1px] after:h-px after:bg-background",
				/*
				 * Opaque on purpose. The goo works by blurring the alpha channel and then
				 * thresholding it back — `0 0 0 18 -7` maps alpha a to 18a - 7 — so a
				 * translucent blob (a = 0.2 gives -3.4, clamped to 0) disappears entirely
				 * under its own filter. The pill therefore paints the same surface the
				 * `default` variant does, just with a full radius and a liquid edge.
				 */
				gooey: "rounded-full border-0 bg-background shadow-none"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	});

	export type TabsListVariant = VariantProps<typeof tabsListVariants>["variant"];

	export type TabsListProps = TabsPrimitive.ListProps & {
		variant?: TabsListVariant;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { getFxContext } from "$lib/fx/context.svelte.js";
	import MorphIndicator from "$lib/motion/morph-indicator.svelte";
	import { setTabsList } from "./tabs.svelte.js";

	let {
		ref = $bindable(null),
		variant = "default",
		class: className,
		children,
		...restProps
	}: TabsListProps = $props();

	const list = setTabsList();
	const fx = getFxContext();

	/*
	 * §5: `gooey` "must degrade to `chrome` under reduced motion, and must not be
	 * the default". The degrade is here rather than in CSS because the SVG filter
	 * is a DOM node, not a declaration — there is nothing for a media query to
	 * switch off. `chrome` is the right target: it is the other variant whose
	 * whole character is the stretch, and under `prefers-reduced-motion` the
	 * duration tokens have already collapsed to 1ms, so it simply lands.
	 */
	const resolved = $derived<TabsListVariant>(
		variant === "gooey" && fx.reducedMotion ? "chrome" : variant
	);

	/** Unique per instance, so two gooey tab strips do not share one filter. */
	const uid = $props.id();
	const filterId = `alrein-tabs-goo-${uid}`;
	const gooStyle = `filter: url(#${filterId})`;

	/*
	 * A horizontal strip's tabs differ in width and share a height; a vertical
	 * one is the transpose. Following only the axis that actually changes keeps
	 * the other scale factor at exactly 1, which is what stops a horizontal
	 * indicator from breathing vertically on a sub-pixel rounding difference.
	 */
	const orientation = $derived(list.orientation === "vertical" ? "vertical" : "horizontal");
</script>

{#snippet indicator()}
	<MorphIndicator
		target={list.active}
		{orientation}
		data-variant={resolved}
		class={cn(tabsIndicatorVariants({ variant: resolved }))}
	/>
{/snippet}

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	data-variant={resolved}
	data-indicator={list.active ? "on" : "off"}
	class={cn(tabsListVariants({ variant: resolved }), className)}
	{...restProps}
>
	{#if resolved === "gooey"}
		<!--
			The goo is `feGaussianBlur` + a high-contrast `feColorMatrix` on the alpha
			channel: blur softens the blob's edges, the matrix pushes them back to
			hard, and the round-trip is what makes a stretching pill read as liquid.

			It has to sit on a layer that contains the blob and nothing else, or it
			would blur the labels too — hence the wrapper. A non-`none` `filter`
			makes that wrapper a containing block, so it becomes the indicator's
			`offsetParent` and `MorphIndicator` measures against it instead of the
			list. That is fine: it measures whatever its offset parent is, and the
			wrapper's border box is the list's padding box.
		-->
		<svg aria-hidden="true" focusable="false" class="pointer-events-none absolute size-0">
			<filter id={filterId} color-interpolation-filters="sRGB">
				<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="alrein-goo-blur" />
				<feColorMatrix
					in="alrein-goo-blur"
					type="matrix"
					values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
				/>
			</filter>
		</svg>
		<div class="pointer-events-none absolute inset-0" style={gooStyle}>
			{@render indicator()}
		</div>
	{:else}
		{@render indicator()}
	{/if}
	{@render children?.()}
</TabsPrimitive.List>
